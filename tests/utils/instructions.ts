import { Keypair, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { getAuctionEscrowPda, getAuctionPda, getAuthorityPda, getEpochInscriptionPda, getReputationPda } from "./pdas";
import fs from 'fs';
import { assert } from "chai";
import { openFile } from "./utils";
import { Bmp } from "../../target/types/bmp";
import { ReputationTracker } from "./reputation";
import { convertBmpToPng } from "./image";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

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
    expectedReputation?: ReputationTracker;
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
    const auctionAta = getAssociatedTokenAddressSync(mint.publicKey, auctionPda, true, TOKEN_2022_PROGRAM_ID);
    const authority = getAuthorityPda(program);
    /*     
        console.table({
            payer: payer.publicKey.toBase58(),
            epochInscription: epochInscriptionPda.toBase58(),
            auction: auctionPda.toBase58(),
            reputation: reputation.toBase58(),
            auctionAta: auctionAta.toBase58(),
            mint: mint.publicKey.toBase58(),
            authority: authority.toBase58(),
        }) 
    */

    const txRequest = program.methods.mintNft(new anchor.BN(epoch))
        .accounts({
            payer: payer.publicKey,
            epochInscription: epochInscriptionPda,
            auction: auctionPda,
            reputation,
            auctionAta,
            mint: mint.publicKey,
            authority,
            tokenProgram: TOKEN_2022_PROGRAM_ID
        }).signers([payer, mint])
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
            png: `./img-outputs/png/ej-${epoch}.png`,
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

interface AuctionBidParams {
    bidAmount: number;
    epoch: number;
    program: Program<Bmp>;
    bidder: Keypair;
    highBidder: PublicKey;
    logMintInfo?: boolean;
    expectToFail?: {
        errorCode: string;
        assertError?: (error: any) => void;
    };
    expectedReputation?: ReputationTracker;
}

export async function bidOnAuction({
    epoch,
    bidAmount,
    program,
    bidder,
    highBidder,
    logMintInfo = false,
    expectToFail,
    expectedReputation
}: AuctionBidParams) {
    const auctionPda = getAuctionPda(epoch, program);
    const reputation = getReputationPda(bidder.publicKey, program);
    const auctionEscrow = getAuctionEscrowPda(program);

    const [prevBidderInitialBalance, { highBidLamports: prevBid }] = await Promise.all([
        program.provider.connection.getBalance(highBidder),
        program.account.auction.fetch(auctionPda)
    ]);

    const txRequest = program.methods.bid(new anchor.BN(epoch), new anchor.BN(bidAmount))
        .accounts({
            bidder: bidder.publicKey,
            highBidder,
            auctionEscrow,
            auction: auctionPda,
            reputation,
        }).signers([bidder])
        .rpc();

    try {

        const signature = await txRequest;
        if (logMintInfo) console.log(`   Epoch ${epoch} - bid signature: ${signature}`);

        const auctionData = await program.account.auction.fetch(auctionPda);
        assert.strictEqual(auctionData.epoch.toNumber(), epoch, "Auction epoch should match the input epoch");
        assert.strictEqual(auctionData.highBidLamports.toNumber(), bidAmount, "High bid should be user's bid");
        assert.strictEqual(auctionData.highBidder.toBase58(), bidder.publicKey.toBase58(), "High bidder should be the bidder");
        assert.deepStrictEqual(auctionData.state, { unClaimed: {} }, 'Auction should be unclaimed');

        if (expectedReputation !== undefined) {
            const reputationData = await program.account.reputation.fetch(reputation);
            assert.strictEqual(reputationData.contributor.toBase58(), expectedReputation.getUser().toBase58(), "Reputation contributor should match payer");
            assert.strictEqual(reputationData.reputation.toNumber(), expectedReputation.getReputation(), "Reputation should match expected value");
        }
        const [finalEscrowBalance, prevBidderFinalBalance] = await Promise.all([
            program.provider.connection.getBalance(auctionEscrow),
            program.provider.connection.getBalance(highBidder)
        ]);
        // After returning funds, the escrow should only have the bid amount
        assert.strictEqual(finalEscrowBalance, bidAmount, "Escrow balance should be increased by the bid amount");
        // After returning funds, the previous bidder should have their previous bid refunded
        assert.strictEqual(prevBidderFinalBalance, prevBidderInitialBalance + prevBid.toNumber(), "Previous bidder should have their bid refunded");

    } catch (error) {
        //console.error(`Error bidding on epoch ${epoch}:`, error);
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