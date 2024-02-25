import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { mintAssetsForEpoch } from "./utils/instructions/initEpoch";
import { assert } from "chai";
import { ReputationTracker } from "./utils/reputation";

const numberEpochs = 1;

describe(`Initiates a New NFT/Auction for ${numberEpochs} Epochs`, () => {
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
    it(`Generates asset for epoch ${i}`, async () => {
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
        expectedReputation: reputationTracker,
        //logErrAndTable: true
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