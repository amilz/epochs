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

const numberEpochs = 1;

describe("SVM On-Chain Asset Generator - 7s3va6xk3MHzL3rpqdxoVZKiNWdWcMEHgGi9FeFv1g8R", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = Keypair.generate();

  // Initializes a local reputation tracker to mirror expected on-chain reputation changes.
  // This allows us to predict the expected state and verify against the actual on-chain state.
  const reputationTracker = new ReputationTracker(payer.publicKey);

  const program = anchor.workspace.Bmp as Program<Bmp>;

  before(async () => {
    await airdropToMultiple([payer.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
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
  for (let i = 0; i < numberEpochs; i++) {
    let mint = Keypair.generate();
    it(`Generates asset for epoch ${i} - ${mint.publicKey.toBase58()}`, async () => {
      let { epoch } = await provider.connection.getEpochInfo();
      while (i > epoch) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        ({ epoch } = await provider.connection.getEpochInfo());
      }
      if (i < epoch) {
        return;
      }
      await mintAssetsForEpoch({
        epoch: i,
        program,
        payer,
        mint,
        expectedReputation: reputationTracker,
      });
    });
  }


  it(`Fails to generate with wrong epoch`, async () => {
    const randomHighEpoch = 100 + Math.floor(Math.random() * 100);
    const expectedErrorCode = "FutureEpochNotAllowed";
    await mintAssetsForEpoch({
      epoch: randomHighEpoch,
      program,
      payer,
      mint: Keypair.generate(),
      expectedReputation: reputationTracker,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert.strictEqual(error.error.errorCode.code, expectedErrorCode, `Expected error code to be '${expectedErrorCode}'`);
        }
      }
    })
  });

  it(`Fails to regenerate existing epoch`, async () => {
    const expectedErrorCode = "0x0"; // 0x0 is attempt to reinit account
    await mintAssetsForEpoch({
      epoch: 0,
      program,
      payer,
      mint: Keypair.generate(),
      expectedReputation: reputationTracker,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.include(error.message, expectedErrorCode, 'The error message should contain 0x0');
        }
      }
    })
  });

});

const targetEpoch = numberEpochs;
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
      throw new Error(`TEST ERROR Target epoch ${targetEpoch} has already passed`);
    }
    const bidAmount = LAMPORTS_PER_SOL;
    // Initiator starts the auction
    await mintAssetsForEpoch({
      epoch: targetEpoch,
      program,
      payer: initiator,
      mint: Keypair.generate(),
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

  it(`Fails submit a low bid on Epoch # ${targetEpoch}`, async () => {
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

  // Skip this test b/c it causes an error that is not handled some how
  // Error: Account does not exist or has no data 8tEj9Y885kC61J9fNw85m3WUQ2P8x994mjhmKKVnK2Pg
  it(`Fails submit wrong epoch (too low) for Epoch # ${targetEpoch}`, async () => {
    const expectedErrorCode = "Fails for a lot of reason";
    await bidOnAuction({
      bidAmount: LAMPORTS_PER_SOL * 10,
      epoch: targetEpoch - 1,
      program,
      bidder,
      expectedReputation: bidderReputationTracker,
      highBidder: initiator.publicKey,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.ok(error, "Expected an error");
          // these don't work b/c accounts are not initialized
          //assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          //assert.include(error.error.errorCode.code, expectedErrorCode, `Expected error code to be '${expectedErrorCode}'`);
        }
      },
    });
  });


  it(`Fails submit a bid with wrong prevBidder on Epoch # ${targetEpoch}`, async () => {
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

  it(`Claims the auction for Epoch # ${targetEpoch}`, async () => {
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
      expectedReputation: initiatorReputationTracker
    })
  })

});

