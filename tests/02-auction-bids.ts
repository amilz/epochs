import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { mintAssetsForEpoch } from "./utils/instructions/initEpoch";
import { assert } from "chai";
import { ReputationTracker } from "./utils/reputation";
import { bidOnAuction } from "./utils/instructions/bid";
import { auctionClaim } from "./utils/instructions/claim";

let targetEpoch: number = 0;

describe("Bids on Auctions", () => {
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
    let { epoch: currentEpoch } = await provider.connection.getEpochInfo();
    targetEpoch = currentEpoch + 1;
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
  it(`Multiple Bids on Single Auction`, async () => {
    let { epoch } = await provider.connection.getEpochInfo();
    while (epoch < targetEpoch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ({ epoch } = await provider.connection.getEpochInfo());
    }
    if (targetEpoch < epoch) {
      throw new Error(`TEST ERROR Target epoch ${targetEpoch} has already passed`);
    }
    const bidAmount = LAMPORTS_PER_SOL;
    // Initiator starts the auction
    await mintAssetsForEpoch({
      epoch: targetEpoch,
      program,
      payer: initiator,
      expectedReputation: initiatorReputationTracker,
    });
    // Bidder bids on the auction
    await bidOnAuction({
      bidAmount,
      epoch: targetEpoch,
      program,
      bidder,
      highBidder: initiator.publicKey,
      expectedReputation: bidderReputationTracker,
    });
    // Initiator bids on the auction
    await bidOnAuction({
      bidAmount: LAMPORTS_PER_SOL * 3,
      epoch: targetEpoch,
      program,
      bidder: initiator,
      highBidder: bidder.publicKey,
      expectedReputation: initiatorReputationTracker,
    });
  });

  it(`Fails submit a low bid in auction}`, async () => {
    const expectedErrorCode = "BidTooLow";
    await bidOnAuction({
      bidAmount: LAMPORTS_PER_SOL / 2,
      epoch: targetEpoch,
      program,
      bidder,
      expectedReputation: bidderReputationTracker,
      highBidder: initiator.publicKey,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert.include(error.error.errorCode.code, expectedErrorCode, `Expected error code to be '${expectedErrorCode}'`);
        }
      }
    });
  });

  it(`Fails submit wrong epoch (too low) for auction`, async () => {
    const expectedErrorCode1 = "AccountNotInitialized";
    const expectedErrorCode2 = "PastEpochNotAllowed";
    // this is likley a throw if an older auction PDA is passed
    // Ideally we can update to test each scenario separately
    const expectedErrorCode3 = "InvalidPreviousBidder";
    await bidOnAuction({
      bidAmount: LAMPORTS_PER_SOL * 10,
      epoch: targetEpoch - 1,
      program,
      bidder,
      expectedReputation: bidderReputationTracker,
      highBidder: initiator.publicKey,
      expectToFail: {
        errorCode: expectedErrorCode1,
        assertError: (error) => {
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert(
            error.error.errorCode.code === expectedErrorCode1 || error.error.errorCode.code === expectedErrorCode2 
            || error.error.errorCode.code === expectedErrorCode3,
            `Expected error code to be '${expectedErrorCode1}', ${expectedErrorCode2}, or '${expectedErrorCode3}', but got '${error.error.errorCode.code}'`
          );
        }
      },
    });
  });

  it(`Fails submit wrong epoch (too high) for auction`, async () => {
    const expectedErrorCode1 = "AccountNotInitialized";
    const expectedErrorCode2 = "FutureEpochNotAllowed";

    await bidOnAuction({
      bidAmount: LAMPORTS_PER_SOL * 10,
      epoch: targetEpoch + 1,
      program,
      bidder,
      expectedReputation: bidderReputationTracker,
      highBidder: initiator.publicKey,
      expectToFail: {
        errorCode: expectedErrorCode1,
        assertError: (error) => {
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert(
            error.error.errorCode.code === expectedErrorCode1 || error.error.errorCode.code === expectedErrorCode2,
            `Expected error code to be '${expectedErrorCode1}' or '${expectedErrorCode2}', but got '${error.error.errorCode.code}'`
          );
        }
      },
    });
  });

  it(`Fails submit a bid with wrong prevBidder for auction`, async () => {
    const expectedErrorCode = "InvalidPreviousBidder";
    
    await bidOnAuction({
      bidAmount: LAMPORTS_PER_SOL / 2,
      epoch: targetEpoch,
      program,
      bidder,
      expectedReputation: bidderReputationTracker,
      highBidder: Keypair.generate().publicKey,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert.include(error.error.errorCode.code, expectedErrorCode, `Expected error code to be '${expectedErrorCode}'`);
        }
      }
    });
  });

  it(`Fails to claim with wrong winner for auction`, async () => {
    let { epoch } = await provider.connection.getEpochInfo();
    while (epoch <= targetEpoch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ({ epoch } = await provider.connection.getEpochInfo());
    }
    if (targetEpoch > epoch) {
      throw new Error(`Target epoch ${targetEpoch} not reached yet`);
    }
    const expectedErrorCode1 = "AccountNotInitialized";
    const expectedErrorCode2 = "InvalidWinner";
    await auctionClaim({
      epoch: targetEpoch,
      program,
      winner: Keypair.generate(),
      daoTreasury: new PublicKey("zuVfy5iuJNZKf5Z3piw5Ho4EpMxkg19i82oixjk1axe"),
      creatorWallet: new PublicKey("zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa"),
      expectedReputation: initiatorReputationTracker,
      expectToFail: {
        errorCode: expectedErrorCode1,
        assertError: (error) => {
          assert.ok(error, "Expected an error");
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert(
            error.error.errorCode.code === expectedErrorCode1 || error.error.errorCode.code === expectedErrorCode2,
            `Expected error code to be '${expectedErrorCode1}' or '${expectedErrorCode2}', but got '${error.error.errorCode.code}'`
          );
        }
      }
    });


  });

  it(`Fails to claim with wrong Treasury`, async () => {
    let { epoch } = await provider.connection.getEpochInfo();
    while (epoch <= targetEpoch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ({ epoch } = await provider.connection.getEpochInfo());
    }
    if (targetEpoch > epoch) {
      throw new Error(`Target epoch ${targetEpoch} not reached yet`);
    }
    const expectedErrorCode = "InvalidTreasury";
    await auctionClaim({
      epoch: targetEpoch,
      program,
      winner: initiator,
      daoTreasury: Keypair.generate().publicKey,
      creatorWallet: new PublicKey("zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa"),
      expectedReputation: initiatorReputationTracker,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.ok(error, "Expected an error");
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert.include(error.error.errorCode.code, expectedErrorCode, `Expected error code to be '${expectedErrorCode}' but got '${error.error.errorCode.code}'`);
        }
      }
    });


  });

  it(`Fails to claim with wrong Creator`, async () => {
    let { epoch } = await provider.connection.getEpochInfo();
    while (epoch <= targetEpoch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ({ epoch } = await provider.connection.getEpochInfo());
    }
    if (targetEpoch > epoch) {
      throw new Error(`Target epoch ${targetEpoch} not reached yet`);
    }
    const expectedErrorCode = "InvalidCreator";
    await auctionClaim({
      epoch: targetEpoch,
      program,
      winner: initiator,
      daoTreasury: new PublicKey("zuVfy5iuJNZKf5Z3piw5Ho4EpMxkg19i82oixjk1axe"),
      creatorWallet: Keypair.generate().publicKey,
      expectedReputation: initiatorReputationTracker,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.ok(error, "Expected an error");
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert.include(error.error.errorCode.code, expectedErrorCode, `Expected error code to be '${expectedErrorCode}' but got '${error.error.errorCode.code}'`);
        }
      }
    });


  });

  it(`Claims the auction for Epoch`, async () => {
    let { epoch } = await provider.connection.getEpochInfo();
    while (epoch <= targetEpoch) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      ({ epoch } = await provider.connection.getEpochInfo());
    }
    if (targetEpoch > epoch) {
      throw new Error(`Target epoch ${targetEpoch} not reached yet`);
    }
    await auctionClaim({
      epoch: targetEpoch,
      program,
      winner: initiator,
      daoTreasury: new PublicKey("zuVfy5iuJNZKf5Z3piw5Ho4EpMxkg19i82oixjk1axe"),
      creatorWallet: new PublicKey("zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa"),
      expectedReputation: initiatorReputationTracker,
      //logErrAndTable: true
    })
  })

});

/*
  TODO: 
    X Assert balance
    X Test bid too low
    X Test invalid high bidder InvalidPreviousBidder
    X Test invalid epoch
    - Simulate auction escrow balance under multiple bids across multiple epochs

*/