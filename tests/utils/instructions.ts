import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { getAuctionPda, getEpochInscriptionPda, getReputationPda } from "./pdas";
import fs from 'fs';
import { assert } from "chai";
import { openFile } from "./utils";
import { Bmp } from "../../target/types/bmp";
import { ReputationTracker } from "./reputation";
import { convertBmpToPng } from "./image";

interface MintAssetsForEpochParams {
    epoch: number;
    program: Program<Bmp>;
    user: Keypair;
    disableOpenFile?: boolean;
    logMintInfo?: boolean;
    expectToFail?: {
        errorCode: string;
        assertError?: (error: any) => void;
    };
    expectedReputation?: ReputationTracker;
}

export async function mintAssetsForEpoch({
    epoch,
    program,
    user,
    disableOpenFile = true,
    logMintInfo = false,
    expectToFail,
    expectedReputation
}: MintAssetsForEpochParams) {
    const auctionPda = getAuctionPda(epoch, program);
    const epochInscriptionPda = getEpochInscriptionPda(epoch, program);
    const computeInstruction = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 });
    const reputation = getReputationPda(user.publicKey, program);
    const txRequest = program.methods.mintNft(new anchor.BN(epoch))
        .accounts({
            user: user.publicKey,
            epochInscription: epochInscriptionPda,
            auction: auctionPda,
            reputation,
        }).signers([user])
        .preInstructions([computeInstruction])
        .rpc();

    try {

        const signature = await txRequest;
        if (logMintInfo) console.log(`   Epoch ${epoch} - mintNft signature: ${signature}`);

        const data = await program.account.epochInscription.fetch(epochInscriptionPda);
        assert.ok(data.buffers.imageRaw.length > 0);

        const auctionData = await program.account.auction.fetch(auctionPda);
        assert.strictEqual(auctionData.epoch.toNumber(), epoch, "Auction epoch should match the input epoch");
        assert.strictEqual(auctionData.highBidLamports.toNumber(), 0, "High bid should be 0");
        assert.strictEqual(auctionData.highBidder.toBase58(), user.publicKey.toBase58(), "High bidder should be the user");
        assert.deepStrictEqual(auctionData.state, { unClaimed: {} }, 'Auction should be unclaimed');

        if (expectedReputation !== undefined) {
            const reputationData = await program.account.reputation.fetch(reputation);
            assert.strictEqual(reputationData.contributor.toBase58(), expectedReputation.getUser().toBase58(), "Reputation contributor should match user");
            assert.strictEqual(reputationData.reputation.toNumber(), expectedReputation.getReputation(), "Reputation should match expected value");
        }

        const filePaths = {
            bmp: `./img-outputs/nouns/ej-${epoch}.bmp`,
            json: `./img-outputs/json/${epoch}.json`,
            png: `./img-outputs/png/ej-${epoch}.png`,
        }

        //fs.writeFileSync(filePaths.bmp, data.buffers.imageRaw);
        fs.writeFileSync(filePaths.json, data.buffers.jsonRaw);
        await convertBmpToPng(data.buffers.imageRaw, filePaths.png);

        if (!disableOpenFile) {
            openFile(filePaths.bmp);
        }
    } catch (error) {
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