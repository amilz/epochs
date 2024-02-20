import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { getAuctionEscrowPda, getAuctionPda, getReputationPda } from "../pdas";
import { assert } from "chai";
import { Bmp } from "../../../target/types/bmp";
import { ReputationTracker } from "../reputation";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

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
    expectedReputation?: ReputationTracker;
}

export async function auctionClaim({
    epoch,
    program,
    winner,
    daoTreasury,
    creatorWallet,
    logMintInfo = false,
    expectToFail,
    expectedReputation
}: AuctionClaimParams) {
    const auctionPda = getAuctionPda(epoch, program);
    const reputation = getReputationPda(winner.publicKey, program);
    const auctionEscrow = getAuctionEscrowPda(program);
    const { mint } = await program.account.auction.fetch(auctionPda);
    const sourceAta = getAssociatedTokenAddressSync(mint, auctionPda, true, TOKEN_2022_PROGRAM_ID);
    const destinationAta = getAssociatedTokenAddressSync(mint, winner.publicKey, false, TOKEN_2022_PROGRAM_ID);

    /*
        const [prevBidderInitialBalance, { highBidLamports: prevBid }] = await Promise.all([
            program.provider.connection.getBalance(highBidder),
            program.account.auction.fetch(auctionPda)
        ]); 
    */

    const txRequest = await program.methods.claim(new anchor.BN(epoch))
        .accounts({
            winner: winner.publicKey,
            auction: auctionPda,
            auctionEscrow,
            reputation,
            daoTreasury,
            creatorWallet,
            mint, // fetch from the auction account
            sourceAta,
            destinationAta,
            tokenProgram: TOKEN_2022_PROGRAM_ID
        })
        .signers([winner])
        .rpc();
    try {

        const signature = await txRequest;
        if (logMintInfo) console.log(`   Epoch ${epoch} - bid signature: ${signature}`);

        const auctionData = await program.account.auction.fetch(auctionPda);
        assert.deepStrictEqual(auctionData.state, { claimed: {} }, 'Auction should be claimed');

        if (expectedReputation !== undefined) {
            const reputationData = await program.account.reputation.fetch(reputation);
            assert.strictEqual(reputationData.contributor.toBase58(), expectedReputation.getUser().toBase58(), "Reputation contributor should match payer");
            assert.strictEqual(reputationData.reputation.toNumber(), expectedReputation.getReputation(), "Reputation should match expected value");
        }

/*
        const [finalEscrowBalance, prevBidderFinalBalance] = await Promise.all([
            program.provider.connection.getBalance(auctionEscrow),
            program.provider.connection.getBalance(highBidder)
        ]);

        // After returning funds, the escrow should only have the bid amount
        assert.strictEqual(finalEscrowBalance, bidAmount, "Escrow balance should be increased by the bid amount");
        // After returning funds, the previous bidder should have their previous bid refunded
        assert.strictEqual(prevBidderFinalBalance, prevBidderInitialBalance + prevBid.toNumber(), "Previous bidder should have their bid refunded");
*/

    } catch (error) {
        console.error(`Error bidding on epoch ${epoch}:`, error);
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