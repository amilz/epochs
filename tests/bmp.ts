
import {
  PublicKey,
  Keypair
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple, createMintMetaAndMasterPdas, getInscriptionAccounts, getMasterEditionAddress, getMetadataAddress } from "./utils/utils";
//@ts-ignore
import fs from 'fs';
import { exec } from 'child_process';
import { TOKEN_METADATA_PROGRAM_ID } from "./utils/consts";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { min } from "bn.js";

describe("bmp", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  let signer = anchor.web3.Keypair.generate();
  let pda = anchor.web3.Keypair.generate();
  const program = anchor.workspace.Bmp as Program<Bmp>;



  const authority = Keypair.generate();
  const user = Keypair.generate();

  const [collectionMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("Collection")],
    program.programId
  );
  const collectionMasterEdition = getMasterEditionAddress(collectionMint);
  const collectionMetadataAccount = getMetadataAddress(collectionMint);
  const collectionTokenAccount = getAssociatedTokenAddressSync(collectionMint, collectionMint, true)

  before(async () => {
    await airdropToMultiple([signer.publicKey, authority.publicKey, user.publicKey], program.provider.connection, anchor.web3.LAMPORTS_PER_SOL);

  });
  it ("test", async () => {
    await mintTest();
  })

  async function mintTest () {
    //it("Mints an NFT", async () => {
      let ixComputeBudget = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 });
      // > Program consumed: 215943 of 299850 compute units (without inscription)
      // > Program consumed: 268106 of 999850 compute units (with inscription)
      try {
        const ixMintNft = await program.methods
          .mintNft()
          .accounts({
            user: user.publicKey,
            pda: pda.publicKey,

          })
          .instruction()
  
        const trx = new anchor.web3.Transaction().add(ixComputeBudget).add(ixMintNft);
        const tx = await anchor.web3.sendAndConfirmTransaction(program.provider.connection, trx, [user, pda],);
        console.log("mintNft sig", tx);
        const data = await program.account.bmp.fetch(pda.publicKey);

        const filePath = `./img-outputs/zzz.bmp`;
        fs.writeFileSync(filePath, data.buffer);
        exec(`open ${filePath}`, (error, _stdout, _stderr) => {
          if (error) {
            console.error(`Error opening file: ${error}`);
          }
        });   
      } catch (e) {
        console.log(e);
      }
  
  
    //})
  }



});
