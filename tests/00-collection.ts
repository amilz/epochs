import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { createCollection } from "./utils/instructions/createCollecion";
import { assert } from "chai";

describe("Create a new WNS Colleciton NFT", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = Keypair.generate();

  const program = anchor.workspace.Bmp as Program<Bmp>;

  before(async () => {
    await airdropToMultiple([payer.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
  });

  it("Cannot create a collection NFT with incorrect WNS Program ID", async () => {
    const expectedErrorCode = "InvalidWnsProgram";
    await createCollection({
      program,
      payer,
      accountOverrides: {
        wnsProgram: anchor.web3.SystemProgram.programId,
      },
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.isTrue(error instanceof anchor.AnchorError, "Expected an AnchorError");
          assert.include(error.error.errorCode.code, expectedErrorCode, `Expected error code to be '${expectedErrorCode}'`);
        }
      }
    })
  })

  it("Creates a collection nft", async () => {
    try {
      await createCollection({
        program,
        payer,
      })
    } catch (err) {
      assert.fail('error minting', err);
    }

  });
  it(`Fails to regenerate collection nft`, async () => {
    const expectedErrorCode = "0x0"; // 0x0 is attempt to reinit account
    await createCollection({
      program,
      payer,
      expectToFail: {
        errorCode: expectedErrorCode,
        assertError: (error) => {
          assert.include(error.message, expectedErrorCode, 'The error message should contain 0x0');
        }
      }
    })
  });

});
