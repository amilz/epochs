import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { getAuctionPda, getAuthorityPda, getEpochInscriptionPda, getReputationPda, getWnsAccounts } from "../pdas";
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
    mint: Keypair;
    disableOpenFile?: boolean;
    logMintInfo?: boolean;
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
    mint,
    disableOpenFile = true,
    logMintInfo = false,
    expectToFail,
    expectedReputation
}: MintAssetsForEpochParams) {
    const auctionPda = getAuctionPda(epoch, program);
    const epochInscriptionPda = getEpochInscriptionPda(epoch, program);
    const computeInstruction = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 });
    const reputation = getReputationPda(payer.publicKey, program);
    const authority = getAuthorityPda(program);
    const auctionAta = getAssociatedTokenAddressSync(
        mint.publicKey,
        auctionPda,
        true,
        TOKEN_2022_PROGRAM_ID
    );
    const { manager, extraMetasAccount } = getWnsAccounts(mint.publicKey);
    const txRequest = program.methods.initEpoch(new anchor.BN(epoch))
        .accounts({
            payer: payer.publicKey,
            epochInscription: epochInscriptionPda,
            auction: auctionPda,
            reputation,
            mint: mint.publicKey,
            authority,
            auctionAta,
            extraMetasAccount, 
            manager,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
            wnsProgram: WNS_PROGRAM_ID
        }).signers([payer, mint])
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
        //console.error(`Error minting assets for epoch ${epoch}:`, error);
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