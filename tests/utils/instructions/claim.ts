import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { getAuctionEscrowPda, getAuctionPda, getAuthorityPda, getReputationPda, getWnsAccounts } from "../pdas";
import { assert } from "chai";
import { Bmp } from "../../../target/types/bmp";
import { ReputationPoints, ReputationTracker } from "../reputation";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { WNS_PROGRAM_ID } from "../consts";

interface AuctionClaimParams {
    epoch: number;
    program: Program<Bmp>;
    winner: Keypair;
    daoTreasury: PublicKey;
    creatorWallet: PublicKey;
    logMintInfo?: boolean;
    expectToFail?: {
        errorCode: string;
        assertError?: (error: any) => void;
    };
    expectedReputation: ReputationTracker;
    logErrAndTable?: boolean;
}

export async function auctionClaim({
    epoch,
    program,
    winner,
    daoTreasury,
    creatorWallet,
    logMintInfo = false,
    expectToFail,
    expectedReputation,
    logErrAndTable = false
}: AuctionClaimParams) {
    const auctionPda = getAuctionPda(epoch, program);
    const reputation = getReputationPda(winner.publicKey, program);
    const auctionEscrow = getAuctionEscrowPda(program);
    const authority = getAuthorityPda(program);
    const { mint } = await program.account.auction.fetch(auctionPda);
    const destinationAta = getAssociatedTokenAddressSync(mint, winner.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const sourceAta = getAssociatedTokenAddressSync(mint, auctionPda, true, TOKEN_2022_PROGRAM_ID);
    const { extraMetasAccount } = getWnsAccounts(mint);
    try {

        const results = await Promise.allSettled([
            program.provider.connection.getBalance(auctionEscrow),
            program.provider.connection.getBalance(daoTreasury),
            program.provider.connection.getBalance(creatorWallet),
            program.account.auction.fetch(auctionPda)
        ]);

        // Extracting values with fallbacks
        const escrowPreBalance = results[0].status === 'fulfilled' ? results[0].value : 0;
        const daoPreBalance = results[1].status === 'fulfilled' ? results[1].value : 0;
        const creatorPreBalance = results[2].status === 'fulfilled' ? results[2].value : 0;
        const { highBidLamports: exceptedEscrowWithdraw } = results[3].status === 'fulfilled' ? results[3].value : { highBidLamports: new anchor.BN(0) };

        const accounts = {
            winner: winner.publicKey,
            auction: auctionPda,
            auctionEscrow,
            reputation,
            daoTreasury,
            creatorWallet,
            authority,
            mint, // fetch from the auction account
            destinationAta,
            sourceAta,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            extraMetasAccount,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            wnsProgram: WNS_PROGRAM_ID
        }

        if (logErrAndTable) {
            const tableData = Object.entries(accounts).map(([key, publicKey]) => ({
                account: key,
                mint: publicKey.toBase58()
            }));
            console.table(tableData);
        }


        const txRequest = await program.methods.claim(new anchor.BN(epoch))
            .accounts(accounts)
            .signers([winner])
            .rpc();

        const signature = await txRequest;
        if (logMintInfo) console.log(`   Epoch ${epoch} - bid signature: ${signature}`);
        expectedReputation.addReputation(ReputationPoints.WIN);

        const auctionData = await program.account.auction.fetch(auctionPda);
        assert.deepStrictEqual(auctionData.state, { claimed: {} }, 'Auction should be claimed');

        if (expectedReputation !== undefined) {
            const reputationData = await program.account.reputation.fetch(reputation);
            assert.strictEqual(reputationData.contributor.toBase58(), expectedReputation.getUser().toBase58(), "Reputation contributor should match payer");
            assert.strictEqual(reputationData.reputation.toNumber(), expectedReputation.getReputation(), "Reputation should match expected value");
        }

        const [escrowPostBalance, daoPostBalance, creatorPostBalance, winnerTokenBalance] = await Promise.all([
            program.provider.connection.getBalance(auctionEscrow),
            program.provider.connection.getBalance(daoTreasury),
            program.provider.connection.getBalance(creatorWallet),
            program.provider.connection.getTokenAccountBalance(destinationAta),
        ]);
        const expectedDaoGain = exceptedEscrowWithdraw.toNumber() * 0.8;
        const expectedCreatorGain = exceptedEscrowWithdraw.toNumber() - expectedDaoGain;
        assert.strictEqual(escrowPostBalance, escrowPreBalance - exceptedEscrowWithdraw.toNumber(), "Auction escrow should have the expected balance");
        assert.strictEqual(daoPostBalance, daoPreBalance + expectedDaoGain, "Dao treasury should have the expected balance");
        assert.strictEqual(creatorPostBalance, creatorPreBalance + expectedCreatorGain, "Creator wallet should have the expected balance");
        assert.strictEqual(winnerTokenBalance.value.uiAmount, 1, "Winner token balance should be 1.");

    } catch (error) {
        if (logErrAndTable) console.error(`Error claiming on epoch ${epoch}:`, error);
        if (expectToFail) {
            if (expectToFail.assertError) {
                expectToFail.assertError(error);
            } else {
                assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
                assert.strictEqual(error.error.errorCode.code, expectToFail.errorCode, `Expected error code ${expectToFail.errorCode}`);
            }
            return;
        }
        throw error;
    }
}