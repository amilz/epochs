import { Keypair, TransactionMessage, VersionedTransaction, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
import { ReputationTracker } from "./utils/reputation";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getAuctionPda, getAuthorityPda } from "./utils/pdas";
import { assert } from "chai";

const WNS_PROGRAM_ID = new PublicKey("wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM")

describe.skip("cpi to wns", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const payer = Keypair.generate();
  const authority = Keypair.generate();

  // Initializes a local reputation tracker to mirror expected on-chain reputation changes.
  // This allows us to predict the expected state and verify against the actual on-chain state.
  const reputationTracker = new ReputationTracker(payer.publicKey);

  const program = anchor.workspace.Bmp as Program<Bmp>;

  before(async () => {
    await airdropToMultiple([authority.publicKey, payer.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
  });

  it("mint using wns cpi", async () => {
    const mint = Keypair.generate();
    const [managerAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("manager")
      ],
      WNS_PROGRAM_ID);
    const [extraMetasAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("extra-account-metas"),
        mint.publicKey.toBuffer()
      ],
      WNS_PROGRAM_ID);
    const auctionPda = getAuctionPda(0, program);

    const accounts = {
      payer: payer.publicKey,
      authority: getAuthorityPda(program), //authority.publicKey
      receiver: auctionPda,
      mint: mint.publicKey,
      mintTokenAccount: getAssociatedTokenAddressSync(
        mint.publicKey,
        auctionPda,
        true,
        TOKEN_2022_PROGRAM_ID
      ),
      extraMetasAccount,
      manager: managerAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      wnsProgram: WNS_PROGRAM_ID
    }

    for (let key in accounts) {
      //console.log(key, accounts[key].toBase58());
    }

    try {
      let ix = await program.methods.wnsCpi()
        .accountsStrict(accounts)
        //.signers([payer, mint, authority])
        .instruction();

      let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
      const messageV0 = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash: blockhash,
        instructions: [ix],
      }).compileToV0Message();
      const txn = new VersionedTransaction(messageV0);

      txn.sign([payer, mint]);

      const serialized = txn.serialize();
      const sig = await provider.connection.sendTransaction(txn);
      console.log("Signature: ", sig);
      assert.ok(sig, "Transaction should have confirmed.");

    } catch (err) {
      console.log("Error: ", err);
    }

  });

});
