import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { mintAssetsForEpoch } from "./utils/instructions";
import { assert } from "chai";

const numberEpochs = 3;

describe("SVM On-Chain Asset Generator", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const authority = Keypair.generate();
  const user = Keypair.generate();
  const program = anchor.workspace.Bmp as Program<Bmp>;

  before(async () => {
    await airdropToMultiple([authority.publicKey, user.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
  });
  it("Generates genesis epoch", async () => {
    await mintAssetsForEpoch({
      epoch: 0,
      program,
      user
    });
  });

  it(`Generates assets over ${numberEpochs} epochs`, async () => {
    let currentEpoch = 0;
    while (currentEpoch < numberEpochs) {
      let { epoch } = await provider.connection.getEpochInfo();
      if ((epoch > currentEpoch)) {
        currentEpoch = epoch;
        await mintAssetsForEpoch({
          epoch: currentEpoch,
          program,
          user
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
