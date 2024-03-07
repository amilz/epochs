import { Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, Connection } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple, initIdlToChain, waitTilEpochIs } from "./utils/utils";
import { assert } from "chai";
import { ReputationTracker } from "./utils/reputation";
import { bidOnAuction } from "./utils/instructions/bid";
import { AUTHORITY } from "./utils/consts";
import { EpochClient } from "@epochs/api";
import { performMinterClaim, performMinterRedeem } from "./utils/instructions/timeMachine";

describe("Create a new OSS Collection, Mint, and Auction", () => {
    const epochClient = EpochClient.local();

    const payer = Keypair.generate();

    const bidder1 = Keypair.generate();
    const bidder2 = Keypair.generate();
    const bidder3 = Keypair.generate();

    const bidder1ReputationTracker = new ReputationTracker(bidder1.publicKey);
    const bidder2ReputationTracker = new ReputationTracker(bidder2.publicKey);
    const bidder3ReputationTracker = new ReputationTracker(bidder3.publicKey);

    const reputationTrackers = new Map([
        [bidder1.publicKey.toBase58(), bidder1ReputationTracker],
        [bidder2.publicKey.toBase58(), bidder2ReputationTracker],
        [bidder3.publicKey.toBase58(), bidder3ReputationTracker],
    ]);

    const auctionResults = new Map<number, { highBidder: Keypair; bidAmount: number }>();

    const TEST_EPOCH = 577; // using warp slot 18464 / 32 slots/epoch = 577 epochs


    before(async () => {
        await initIdlToChain();
        await airdropToMultiple([AUTHORITY.publicKey, payer.publicKey, bidder1.publicKey, bidder2.publicKey, bidder3.publicKey], epochClient.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
    });

    it("Creats a group OSS NFT", async () => {
        try {
            const tx = await epochClient.createGroupTransaction({ payer: AUTHORITY.publicKey });
            const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(AUTHORITY);
            const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [AUTHORITY]);
            assert.ok(sig, 'should have signature');
        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }
    });

    it("Creates an OSS NFT and initiates auction", async () => {

        try {
            const tx = await epochClient.createInitEpochTransaction({ payer: payer.publicKey });
            const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer);
            const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [payer]);
            const { epoch } = await epochClient.connection.getEpochInfo();
            const deserializedAsset = await epochClient.fetchDeserializedAssetByEpoch({ epoch });
            // TODO Add Tests on the assetWithoutExtensions
            assert.ok(sig, 'should have signature');

        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });



/*     it.skip("Simulates bidding war an auction", async () => {
        const numberOfBids = 10 + Math.floor(Math.random() * 5); // Random number of bids
        let lastBidAmount = LAMPORTS_PER_SOL; // Starting bid amount for the auction
        let lastBidder = payer; // Initiator is the first high bidder

        for (let i = 0; i < numberOfBids; i++) {
            const bidResult = await performRandomBid({
                this.program,
                epoch: TEST_EPOCH,
                bidders: [bidder1, bidder2, bidder3],
                reputationTrackers,
                lastBidAmount: lastBidAmount,
                lastBidder: lastBidder.publicKey,
            });
            lastBidAmount = bidResult.bidAmount;
            lastBidder = bidResult.highBidder;
        }
        auctionResults.set(TEST_EPOCH, { highBidder: lastBidder, bidAmount: lastBidAmount });

    });
 */
    it("Creates multiple bids", async () => {
        const bidAmount = (Math.floor(Math.random() * 10) + 1) * LAMPORTS_PER_SOL;
        const bid1 = {
            amount: (Math.floor(Math.random() * 10) + 1) * LAMPORTS_PER_SOL,
            bidder: bidder1,
        }
        const bid2 = {
            bidAmount: bid1.amount + 2 * LAMPORTS_PER_SOL,
            bidder: bidder2,
        }

        const bid3 = {
            bidAmount: bid2.bidAmount + 2 * LAMPORTS_PER_SOL,
            bidder: bidder3,
        }

        const bids = [{ bidAmount: bid1.amount, bidder: bid1.bidder }, { bidAmount: bid2.bidAmount, bidder: bid2.bidder }, { bidAmount: bid3.bidAmount, bidder: bid3.bidder },];

        for (const bid of bids) {
            try {
                const tx = await epochClient.createBidTransaction({ bidAmount: bid.bidAmount, bidder: bid.bidder.publicKey });
                const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.lastValidBlockHeight = lastValidBlockHeight;
                tx.sign(bid.bidder);
                const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [bid.bidder]);
                assert.ok(sig, 'should have signature');
            } catch (err) {
                console.log(err);
                assert.fail('error minting', err);
            }
        }
    });

    it("Auction winner claims rewards", async () => {
        const { epoch } = await epochClient.connection.getEpochInfo();
        await waitTilEpochIs(epoch + 1, epochClient.connection);

        try {
            const tx = await epochClient.createClaimInstruction({ winner: bidder3.publicKey, epoch });
            const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer);
            const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [bidder3]);
            assert.ok(sig, 'should have signature');
        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });

});

describe("Simulates retroactive mint aka Time Machine", () => {
    const epochClient = EpochClient.local();

    it("Initiates the Minter", async () => {
        const now = new Date().getTime();
        // 5 seconds from now:
        const target = new Date(now + 5 * 1000).getTime();
        // const tomorrow = new Date(now + 24 * 60 * 60 * 1000).getTime();

        try {
            const tx = await epochClient.createTimeMachineInitInstruction({ itemsAvailable: 500, startTime: target / 1000 });
            const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(AUTHORITY);
            const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [AUTHORITY]);
            assert.ok(sig, 'should have signature');
        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });

    it("Claim and reveal 500 mints from minter machine", async () => {
        const numberOfMints = 50;
        const numLoops = 10;
        for (let i = 0; i < numLoops; i++) {
            try {
                const minters = Array.from({ length: numberOfMints }, (_, i) => Keypair.generate());
                await airdropToMultiple(minters.map(m => m.publicKey), epochClient.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
                await new Promise(resolve => setTimeout(resolve, 10000));
                const claimPromises = minters.map(async (minter, i) => {
                    return performMinterClaim(minter, epochClient);
                });
                await Promise.all(claimPromises);
                const state = await epochClient.fetchMinterDetails();
                assert.equal(state.itemsRedeemed.toNumber(), (numberOfMints * (i + 1)), "1 Mint expected for each minter");
                const redeemPromises = minters.map(async (minter, i) => {
                    return performMinterRedeem(minter, epochClient);
                });
                await Promise.all(redeemPromises);
            } catch (err) {
                console.log(err);
                assert.fail('error minting', err);
            }
        }
        const state = await epochClient.fetchMinterDetails();
        assert.equal(state.itemsRedeemed.toNumber(), (numberOfMints * numLoops), "1 Mint expected for each minter");
        assert.isFalse(state.active, "Minter should be inactive after all mints are redeemed");
    });

});








