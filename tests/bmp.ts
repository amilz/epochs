import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { mintAssetsForEpoch } from "./utils/instructions";
import { assert } from "chai";
import { ReputationPoints, ReputationTracker } from "./utils/reputation";

const numberEpochs = 3;

describe("SVM On-Chain Asset Generator", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const authority = Keypair.generate();
  const user = Keypair.generate();

  // Initializes a local reputation tracker to mirror expected on-chain reputation changes.
  // This allows us to predict the expected state and verify against the actual on-chain state.
  const reputationTracker = new ReputationTracker(user.publicKey);

  const program = anchor.workspace.Bmp as Program<Bmp>;

  before(async () => {
    await airdropToMultiple([authority.publicKey, user.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
  });

  it("Generates genesis epoch", async () => {
    reputationTracker.addReputation(ReputationPoints.INITIATE);
    await mintAssetsForEpoch({
      epoch: 0,
      program,
      user,
      expectedReputation: reputationTracker
    });
  });

  it(`Generates assets over ${numberEpochs} epochs`, async () => {
    let currentEpoch = 0;
    while (currentEpoch < numberEpochs) {
      let { epoch } = await provider.connection.getEpochInfo();
      if ((epoch > currentEpoch)) {
        currentEpoch = epoch;
        reputationTracker.addReputation(ReputationPoints.INITIATE);
        await mintAssetsForEpoch({
          epoch: currentEpoch,
          program,
          user,
          expectedReputation: reputationTracker
        });
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });

  it(`Fails to generate with wrong epoch`, async () => {
    const randomHighEpoch = 100 + Math.floor(Math.random() * 100);
    const expectedErrorCode = "InvalidEpoch";
    await mintAssetsForEpoch({
      epoch: randomHighEpoch,
      program,
      user,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
          assert.strictEqual(error.error.errorCode.code, expectedErrorCode, `Expected error code to be '${expectedErrorCode}'`);
        }
      }
    })
  });

});
