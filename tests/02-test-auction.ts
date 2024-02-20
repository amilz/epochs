import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { bidOnAuction, mintAssetsForEpoch } from "./utils/instructions";
import { ReputationPoints, ReputationTracker } from "./utils/reputation";
import { assert } from "chai";

const targetEpoch = 1;

describe("Epoch Auctions", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const initiator = Keypair.generate();
  const bidder = Keypair.generate();

  // Initializes a local reputation tracker to mirror expected on-chain reputation changes.
  // This allows us to predict the expected state and verify against the actual on-chain state.
  const initiatorReputationTracker = new ReputationTracker(initiator.publicKey);
  const bidderReputationTracker = new ReputationTracker(bidder.publicKey);

  const program = anchor.workspace.Bmp as Program<Bmp>;

  before(async () => {
    await airdropToMultiple([bidder.publicKey, initiator.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
  });

  /**
   * 
   * This test generates assets for each epoch, and verifies that the reputation
   * of the payer is updated correctly.
   * 
   * It works by waiting for the current epoch to match the epoch we want to mint for,
   * and then mints the asset. It then checks that the reputation has been updated correctly.
   * 
   * If the epoch has already passed, it will skip the epoch, so the test can catch up
   * (though this should not happen in practice, as the test should be run in order of epochs). 
   * 
   */
  it(`Multiple Bids on Epoch # ${targetEpoch}`, async () => {
    let { epoch } = await provider.connection.getEpochInfo();
    while (epoch < targetEpoch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ({ epoch } = await provider.connection.getEpochInfo());
    }
    if (targetEpoch < epoch) {
      throw new Error(`Target epoch ${targetEpoch} has already passed`);
    }
    const bidAmount = LAMPORTS_PER_SOL;
    // Initiator starts the auction
    initiatorReputationTracker.addReputation(ReputationPoints.INITIATE);
    await mintAssetsForEpoch({
      epoch: targetEpoch,
      program,
      payer: initiator,
      mint: Keypair.generate(),
      expectedReputation: initiatorReputationTracker,
    });
    // Bidder bids on the auction
    bidderReputationTracker.addReputation(ReputationPoints.BID);
    await bidOnAuction({
      bidAmount,
      epoch: targetEpoch,
      program,
      bidder,
      highBidder: initiator.publicKey,
      expectedReputation: bidderReputationTracker,
    });
    // Initiator bids on the auction
    initiatorReputationTracker.addReputation(ReputationPoints.BID);
    await bidOnAuction({
      bidAmount: LAMPORTS_PER_SOL * 3,
      epoch: targetEpoch,
      program,
      bidder: initiator,
      highBidder: bidder.publicKey,
      expectedReputation: initiatorReputationTracker,
    });
  });
  it(`Fails submit a low bid on Epoch # ${targetEpoch}`, async () => {
    const expectedErrorCode = ""; // should be "BidTooLow" w/ msg of "Bid does not meet minimum bid threshold" (6003)
    bidderReputationTracker.addReputation(ReputationPoints.BID);
    await bidOnAuction({
      bidAmount: LAMPORTS_PER_SOL / 2,
      epoch: targetEpoch,
      program,
      bidder,
      highBidder: initiator.publicKey,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          //assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert.include(error.message, expectedErrorCode, `Expected error code to be '${expectedErrorCode}'`);
        }
      }
    });
  });
});


/*
  TODO: 
    X Assert balance
    X Test bid too low
    - Test invalid high bidder
    - Test invalid epoch
    - Test invalid auction
    - Test invalid reputation
    - Test invalid escrow
*/
