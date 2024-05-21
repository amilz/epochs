import { Keypair, PublicKey, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorError } from "@coral-xyz/anchor";
import { assert } from "chai";
import { ReputationPoints, ReputationTracker } from "../reputation";
import { EpochClient } from "@epochs/api";

interface AuctionBidParams {
    bidAmount: number;
    epoch: number;
    client: EpochClient;
    bidder: Keypair;
    highBidder: PublicKey;
    logMintInfo?: boolean;
    expectToFail?: {
        errorCode: string;
        assertError?: (error: any) => void;
    };
    expectedReputation: ReputationTracker;
}

export async function bidOnAuction({
    epoch,
    bidAmount,
    client,
    bidder,
    highBidder,
    logMintInfo = false,
    expectToFail,
    expectedReputation
}: AuctionBidParams) {
    const auctionEscrow = client.fetchAuctionEscrowPda();


    try {

        const results = await Promise.allSettled([
            client.connection.getBalance(highBidder),
            client.fetchAuction({ epoch, commitment: 'processed' }),
            client.connection.getBalance(auctionEscrow)
        ]);

        // Extracting and providing fallback values
        const prevBidderInitialBalance = results[0].status === 'fulfilled' ? results[0].value : 0;
        const { highBidLamports: prevBid } = results[1].status === 'fulfilled' ? results[1].value : { highBidLamports: new anchor.BN(0) };
        const initialEscrowBalance = results[2].status === 'fulfilled' ? results[2].value : 0;

        const tx = await client.createBidTransaction({ bidAmount, bidder: bidder.publicKey });
        const { blockhash, lastValidBlockHeight } = await client.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.sign(bidder);

        let sig = await sendAndConfirmTransaction(client.connection, tx, [bidder], { skipPreflight: true });

        if (logMintInfo) console.log(`   Epoch ${epoch} - bid signature: ${sig}`);
        expectedReputation.addReputation(ReputationPoints.BID);

        const finalAuctionData = await client.fetchAuction({ epoch, commitment: 'processed' });
        assert.strictEqual(finalAuctionData.epoch.toNumber(), epoch, "Auction epoch should match the input epoch");
        assert.strictEqual(finalAuctionData.highBidLamports.toNumber(), bidAmount, "High bid should be user's bid");
        assert.strictEqual(finalAuctionData.highBidder.toBase58(), bidder.publicKey.toBase58(), "High bidder should be the bidder");
        assert.deepStrictEqual(finalAuctionData.state, { unClaimed: {} }, 'Auction should be unclaimed');


        if (expectedReputation !== undefined) {
            const reputationData = await client.fetchReputation({ user: bidder.publicKey });
            assert.strictEqual(reputationData.contributor.toBase58(), expectedReputation.getUser().toBase58(), "Reputation contributor should match payer");
            assert.strictEqual(reputationData.reputation.toNumber(), expectedReputation.getReputation(), "Reputation should match expected value");
        }

        const [finalEscrowBalance, prevBidderFinalBalance] = await Promise.all([
            client.connection.getBalance(auctionEscrow),
            client.connection.getBalance(highBidder)
        ]);

        assert.strictEqual(finalEscrowBalance, initialEscrowBalance + bidAmount - prevBid.toNumber(), `After tx, final escrow should have the previous balance plus the new bid amount minus the previous bid amount - ${sig}`);

        if (highBidder.toBase58() === bidder.publicKey.toBase58()) return; // need to skip this if previous bidder is the same as the current bidder
        assert.strictEqual(prevBidderFinalBalance, prevBidderInitialBalance + prevBid.toNumber(), `Previous bidder should have had their bid refunded - ${sig}`);

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

export async function performRandomBid({
    client,
    epoch,
    bidders,
    reputationTrackers,
    lastBidAmount,
    lastBidder, // Add the last bidder as a parameter
}: {
    client: EpochClient,
    epoch: number,
    bidders: Keypair[],
    reputationTrackers: Map<string, ReputationTracker>,
    lastBidAmount: number,
    lastBidder: PublicKey, // Use PublicKey type for the last bidder
}) {
    const randomBidderIndex = Math.floor(Math.random() * bidders.length);
    const bidder = bidders[randomBidderIndex];
    // Ensure the next bid is at least 1.5 SOL greater than the last bid
    const bidIncrement = Math.floor((1.5 + Math.random()) * LAMPORTS_PER_SOL); // Random increment, minimum 1.5 SOL
    const bidAmount = lastBidAmount + bidIncrement;

    const reputationTracker = reputationTrackers.get(bidder.publicKey.toBase58())!;

    await bidOnAuction({
        bidAmount,
        epoch,
        client,
        bidder,
        highBidder: lastBidder, // Use the last bidder as the highBidder for this bid
        expectedReputation: reputationTracker,
    });

    return { bidAmount, highBidder: bidder }; // Return the current bid amount and bidder public key for the next bid
}