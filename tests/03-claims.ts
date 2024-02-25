import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { mintAssetsForEpoch } from "./utils/instructions/initEpoch";
import { ReputationPoints, ReputationTracker } from "./utils/reputation";
import { bidOnAuction } from "./utils/instructions/bid";
import { auctionClaim } from "./utils/instructions/claim";

async function performRandomBid({
  program,
  epoch,
  bidders,
  reputationTrackers,
  lastBidAmount,
  lastBidder, // Add the last bidder as a parameter
}: {
  program: Program<Bmp>,
  epoch: number,
  bidders: Keypair[],
  reputationTrackers: Map<string, ReputationTracker>,
  lastBidAmount: number,
  lastBidder: PublicKey, // Use PublicKey type for the last bidder
}) {
  const randomBidderIndex = Math.floor(Math.random() * bidders.length);
  const bidder = bidders[randomBidderIndex];
  // Ensure the next bid is at least 1.5 SOL greater than the last bid
  const bidIncrement = 1.5 + Math.random(); // Random increment, minimum 1.5 SOL
  const bidAmount = lastBidAmount + bidIncrement * LAMPORTS_PER_SOL;

  const reputationTracker = reputationTrackers.get(bidder.publicKey.toBase58())!;
  reputationTracker.addReputation(ReputationPoints.BID);

  await bidOnAuction({
    bidAmount,
    epoch,
    program,
    bidder,
    highBidder: lastBidder, // Use the last bidder as the highBidder for this bid
    expectedReputation: reputationTracker,
  });

  return { bidAmount, highBidder: bidder }; // Return the current bid amount and bidder public key for the next bid
}

const auctionResults = new Map<number, { highBidder: Keypair; bidAmount: number }>();

describe("Simulates Random Bids & Claims across epochs", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const initiator = Keypair.generate();
  const bidder1 = Keypair.generate();
  const bidder2 = Keypair.generate();
  const bidder3 = Keypair.generate();

  // Initializes a local reputation tracker to mirror expected on-chain reputation changes.
  // This allows us to predict the expected state and verify against the actual on-chain state.
  const initiatorReputationTracker = new ReputationTracker(initiator.publicKey);
  const bidder1ReputationTracker = new ReputationTracker(bidder1.publicKey);
  const bidder2ReputationTracker = new ReputationTracker(bidder2.publicKey);
  const bidder3ReputationTracker = new ReputationTracker(bidder3.publicKey);

  const reputationTrackers = new Map([
    [bidder1.publicKey.toBase58(), bidder1ReputationTracker],
    [bidder2.publicKey.toBase58(), bidder2ReputationTracker],
    [bidder3.publicKey.toBase58(), bidder3ReputationTracker],
  ])

  const program = anchor.workspace.Bmp as Program<Bmp>;


  before(async () => {
    await airdropToMultiple([bidder1.publicKey, bidder2.publicKey, bidder3.publicKey, initiator.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);

    // Wait for the current epoch to change to the next epoch
    let { epoch: currentEpoch } = await provider.connection.getEpochInfo();
    let nextEpoch = currentEpoch + 1;
    while (currentEpoch <= nextEpoch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ({ epoch: currentEpoch } = await provider.connection.getEpochInfo());
    }
  });

  it("Simulate random bids across multiple epochs", async () => {
    for (let targetEpoch = 1; targetEpoch <= 3; targetEpoch++) {
      let { epoch } = await provider.connection.getEpochInfo();
      while (targetEpoch > epoch) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        ({ epoch } = await provider.connection.getEpochInfo());
      }
      if (targetEpoch < epoch) {
        return;
      }
      await mintAssetsForEpoch({
        epoch: targetEpoch,
        program,
        payer: initiator,
        expectedReputation: initiatorReputationTracker,
      });

      // Setup for the bidding simulation
      let lastBidAmount = LAMPORTS_PER_SOL; // Starting bid amount for the auction
      let lastBidder = initiator; // Initiator is the first high bidder

      const numberOfBids = 5 + Math.floor(Math.random() * 5); // Random number of bids
      for (let i = 0; i < numberOfBids; i++) {
        const bidResult = await performRandomBid({
          program,
          epoch: targetEpoch,
          bidders: [bidder1, bidder2, bidder3],
          reputationTrackers,
          lastBidAmount,
          lastBidder: lastBidder.publicKey,
        });

        // Update the lastBidAmount and lastBidder for the next iteration
        lastBidAmount = bidResult.bidAmount;
        lastBidder = bidResult.highBidder;
      }
      auctionResults.set(targetEpoch, { highBidder: lastBidder, bidAmount: lastBidAmount });

    }
  });


  it("Claim rewards for high bidders", async () => {
    // Wait for the current epoch to change to the next epoch to ensure we can claim.
    let { epoch: currentEpoch } = await provider.connection.getEpochInfo();
    let nextEpoch = currentEpoch + 1;
    while (currentEpoch <= nextEpoch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ({ epoch: currentEpoch } = await provider.connection.getEpochInfo());
    }
    for (const [epoch, { highBidder }] of auctionResults.entries()) {
      let expectedReputation = reputationTrackers.get(highBidder.publicKey.toBase58())!;

      await auctionClaim({
        epoch,
        program,
        winner: highBidder,
        daoTreasury: new PublicKey("zuVfy5iuJNZKf5Z3piw5Ho4EpMxkg19i82oixjk1axe"),
        creatorWallet: new PublicKey("zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa"),
        expectedReputation,
        //logErrAndTable: true
      })
    }
  });






});

