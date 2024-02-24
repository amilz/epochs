import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { createCollection } from "./utils/instructions/createCollecion";
import { assert } from "chai";

describe.only("create new collection", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = Keypair.generate();
  const authority = Keypair.generate();

  // Initializes a local reputation tracker to mirror expected on-chain reputation changes.
  // This allows us to predict the expected state and verify against the actual on-chain state.

  const program = anchor.workspace.Bmp as Program<Bmp>;

  before(async () => {
    await airdropToMultiple([authority.publicKey, payer.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
  });

  it("creates a collection nft", async () => {
    try {
      await createCollection({
        program,
        payer,
      })
    } catch (err) {
      assert.fail('error minting', err);
    }

  });

});
