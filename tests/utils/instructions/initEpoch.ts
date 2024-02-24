import { Keypair, ComputeBudgetProgram } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { getAuctionPda, getAuthorityPda, getCollectionMintPda, getEpochInscriptionPda, getNftMintPda, getReputationPda, getWnsAccounts } from "../pdas";
import fs from 'fs';
import { assert } from "chai";
import { openFile } from "../utils";
import { Bmp } from "../../../target/types/bmp";
import { ReputationPoints, ReputationTracker } from "../reputation";
import { convertBmpToPng } from "../image";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { WNS_PROGRAM_ID } from "../consts";


interface MintAssetsForEpochParams {
    epoch: number;
    program: Program<Bmp>;
    payer: Keypair;
    disableOpenFile?: boolean;
    logMintInfo?: boolean;
    logErrAndTable?: boolean;
    expectToFail?: {
        errorCode: string;
        assertError?: (error: any) => void;
    };
    expectedReputation: ReputationTracker;
}

export async function mintAssetsForEpoch({
    epoch,
    program,
    payer,
    disableOpenFile = true,
    logMintInfo = false,
    logErrAndTable = false,
    expectToFail,
    expectedReputation
}: MintAssetsForEpochParams) {
    const auctionPda = getAuctionPda(epoch, program);
    const epochInscriptionPda = getEpochInscriptionPda(epoch, program);
    const computeInstruction = ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 });
    const reputation = getReputationPda(payer.publicKey, program);
    const authority = getAuthorityPda(program);
    const mint = getNftMintPda(program, epoch);
    const collectionMint = getCollectionMintPda(program);
    const { groupAccount } = getWnsAccounts(collectionMint);

    const auctionAta = getAssociatedTokenAddressSync(
        mint,
        auctionPda,
        true,
        TOKEN_2022_PROGRAM_ID
    );
    const { manager, extraMetasAccount, memberAccount } = getWnsAccounts(mint);

    const accounts = {
        payer: payer.publicKey,
        epochInscription: epochInscriptionPda,
        auction: auctionPda,
        reputation,
        mint,
        authority,
        auctionAta,
        extraMetasAccount,
        manager,
        group: groupAccount,
        member: memberAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        wnsProgram: WNS_PROGRAM_ID
    };



    if (logErrAndTable) {
        const tableData = Object.entries(accounts).map(([key, publicKey]) => ({
            account: key,
            mint: publicKey.toBase58()
        }));
        console.table(tableData);
    }

    const txRequest = program.methods.initEpoch(new anchor.BN(epoch))
        .accounts(accounts)
        .signers([payer])
        .preInstructions([computeInstruction])
        .rpc();

    try {

        const signature = await txRequest;
        if (logMintInfo) console.log(`   Epoch ${epoch} - mintNft signature: ${signature}`);
        expectedReputation.addReputation(ReputationPoints.INITIATE);

        const [data, auctionData] = await Promise.all([
            program.account.epochInscription.fetch(epochInscriptionPda),
            program.account.auction.fetch(auctionPda),
        ]);

        assert.ok(data.buffers.imageRaw.length > 0);
        assert.strictEqual(auctionData.epoch.toNumber(), epoch, "Auction epoch should match the input epoch");
        assert.strictEqual(auctionData.highBidLamports.toNumber(), 0, "High bid should be 0");
        assert.strictEqual(auctionData.highBidder.toBase58(), payer.publicKey.toBase58(), "High bidder should be the payer");
        assert.deepStrictEqual(auctionData.state, { unClaimed: {} }, 'Auction should be unclaimed');

        if (expectedReputation !== undefined) {
            const reputationData = await program.account.reputation.fetch(reputation);
            assert.strictEqual(reputationData.contributor.toBase58(), expectedReputation.getUser().toBase58(), "Reputation contributor should match payer");
            assert.strictEqual(reputationData.reputation.toNumber(), expectedReputation.getReputation(), "Reputation should match expected value");
        }

        const filePaths = {
            bmp: `./img-outputs/nouns/ej-${epoch}.bmp`,
            json: `./img-outputs/json/${epoch}.json`,
            png: `./img-outputs/pn/wns-${epoch}.png`,
        }

        //fs.writeFileSync(filePaths.bmp, data.buffers.imageRaw);
        fs.writeFileSync(filePaths.json, data.buffers.jsonRaw);
        await convertBmpToPng(data.buffers.imageRaw, filePaths.png);

        if (!disableOpenFile) {
            openFile(filePaths.bmp);
        }
    } catch (error) {
        if (logErrAndTable) console.error(error);
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