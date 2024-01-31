import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple } from "./utils/utils";
//@ts-ignore
import fs from 'fs';
import { exec } from 'child_process';

describe("bmp", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  let signer = anchor.web3.Keypair.generate();
  let pda = anchor.web3.Keypair.generate();
  const program = anchor.workspace.Bmp as Program<Bmp>;
  before(async () => {
    await airdropToMultiple([signer.publicKey], program.provider.connection, anchor.web3.LAMPORTS_PER_SOL);
  });
  it("Is initialized!", async () => {
    // Add your test here.
    try {
      let ix = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 });

      const ix2 = await program.methods.initialize().accounts({
        signer: signer.publicKey,
        pda: pda.publicKey,
      }).signers([signer, pda]).instruction();
      const trx = new anchor.web3.Transaction().add(ix).add(ix2);
      const tx = await anchor.web3.sendAndConfirmTransaction(program.provider.connection, trx, [signer, pda], )
      console.log(`https://explorer.solana.com/tx/${tx}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`)
    } catch (error) {
      console.error(error);
    }
    const data = await program.account.bmp.fetch(pda.publicKey);
    //console.log(data.buffer);


    const filePath = `./img-outputs/output${Math.floor(Math.random() * 1000000)}.bmp`;
    fs.writeFileSync(filePath, data.buffer);
    exec(`open ${filePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error opening file: ${error}`);
      }
    });
  });
});
