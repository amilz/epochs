import { EpochClient } from "@epochs/api";
import { Keypair, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { airdropToMultiple, initIdlToChain } from "./utils/utils";
import { assert } from "chai";

describe("Tests Epochs API", async () => {
    const epochClient = EpochClient.local();
    const payer = Keypair.generate();

    const bidder1 = Keypair.generate();
    const bidder2 = Keypair.generate();

    const bid1 = (Math.floor(Math.random() * 10) + 1) * LAMPORTS_PER_SOL;
    const bid2 = ((Math.floor(Math.random() * 10) + 1) * LAMPORTS_PER_SOL) + bid1;

    before(async () => {
        await initIdlToChain();
        await airdropToMultiple([
            payer.publicKey,
            bidder1.publicKey,
            bidder2.publicKey
        ], epochClient.connection, 100 * LAMPORTS_PER_SOL);
    });

    it("Should create a new collection", async () => {
        try {
            const collectionIx = await epochClient.createNewCollectionInstruction({ payer: payer.publicKey });
            const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
            const transaction = new Transaction().add(collectionIx);
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.sign(payer);
            const signature = await sendAndConfirmTransaction(epochClient.connection, transaction, [payer]);
            assert.ok(signature);
        } catch (error) {
            console.log(error);
            assert.fail("Failed to create a new collection");
        }

    });
    it("Should create a initialize a new epoch", async () => {
        try {
            const { initInstruction, computeInstruction } = await epochClient.createInitEpochInstruction({ payer: payer.publicKey });
            const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
            const transaction = new Transaction().add(computeInstruction).add(initInstruction);
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.sign(payer);
            const signature = await sendAndConfirmTransaction(epochClient.connection, transaction, [payer]);
            assert.ok(signature);
        } catch (error) {
            console.log(error);
            assert.fail("Failed to initialize a new epoch");
        }
    });

    it("Should create a bid", async () => {
        try {
            const bidIx = await epochClient.createBidInstruction({
                bidder: bidder1.publicKey,
                bidAmount: bid1,
            });
            const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
            const transaction = new Transaction().add(bidIx);
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.sign(bidder1);
            const signature = await sendAndConfirmTransaction(epochClient.connection, transaction, [bidder1]);
            assert.ok(signature);
        } catch (error) {
            console.log(error);
            assert.fail("Failed to create a bid");
        }
    });

    it("Should create a second bid", async () => {
        try {
            const bidIx = await epochClient.createBidInstruction({
                bidder: bidder2.publicKey,
                bidAmount: bid2,
            });
            const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
            const transaction = new Transaction().add(bidIx);
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.sign(bidder2);
            const signature = await sendAndConfirmTransaction(epochClient.connection, transaction, [bidder2]);
            assert.ok(signature);
        } catch (error) {
            console.log(error);
            assert.fail("Failed to create a bid");
        }
    });

    it("Should claim the auction after epoch ends", async () => {
        const { epoch: initialEpoch } = await epochClient.connection.getEpochInfo();
        let currentEpoch = initialEpoch;
        while (currentEpoch === initialEpoch) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            currentEpoch = (await epochClient.connection.getEpochInfo()).epoch;

        }
        try {
            const auctionData = await epochClient.fetchAuction({ epoch: initialEpoch });
            const winner = auctionData.highBidder;
            const claimIx = await epochClient.createClaimInstruction({ epoch: initialEpoch, winner });
            const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
            const transaction = new Transaction().add(claimIx);
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            // We know that Bidder 2 should be the winner
            transaction.sign(bidder2);
            const signature = await sendAndConfirmTransaction(epochClient.connection, transaction, [bidder2]);
            assert.ok(signature);
        } catch (error) {
            console.log(error);
            assert.fail("Failed to claim the auction");
        }

    });


});