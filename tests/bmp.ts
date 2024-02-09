
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
  it("Creates a Collection", async () => {

    try {
      const ix = await program.methods
        .createCollectionNft()
        .accounts({
          authority: authority.publicKey,
          collectionMint,
          collectionMetadataAccount,
          collectionMasterEdition,
          collectionTokenAccount,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([authority])
        .instruction();
      const trx = new anchor.web3.Transaction().add(ix);
      const tx = await anchor.web3.sendAndConfirmTransaction(program.provider.connection, trx, [authority],)

      console.log("createCollection sig", tx);
    } catch (e) {
      console.log(e);
    }
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
      const tx = await anchor.web3.sendAndConfirmTransaction(program.provider.connection, trx, [signer, pda],)
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

  it("Mints an NFT", async () => {
    let ixComputeBudget = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 });
    // > Program consumed: 215943 of 299850 compute units (without inscription)
    // > Program consumed: 268106 of 999850 compute units (with inscription)
    const { mintKeypair, metadataPda, masterEditionPda } = createMintMetaAndMasterPdas();
    const tokenAccount = getAssociatedTokenAddressSync(mintKeypair.publicKey, user.publicKey)
    const {
      inscriptionProgram,
      mintInscriptionAccount,
      inscriptionMetadataAccount,
      inscriptionShardAccount
    } = getInscriptionAccounts(mintKeypair.publicKey);
    try {
      const ixMintNft = await program.methods
        .mintNft()
        .accounts({
          user: user.publicKey,
          collectionMint,
          collectionMetadataAccount,
          collectionMasterEdition,
          nftMint: mintKeypair.publicKey,
          metadataAccount: metadataPda,
          masterEdition: masterEditionPda,
          tokenAccount,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          inscriptionProgram,
          mintInscriptionAccount,
          inscriptionMetadataAccount,
          inscriptionShardAccount,
        })
        .instruction()

      const trx = new anchor.web3.Transaction().add(ixComputeBudget).add(ixMintNft);
      const tx = await anchor.web3.sendAndConfirmTransaction(program.provider.connection, trx, [user, mintKeypair],);
      console.log("mintNft sig", tx);

      
    } catch (e) {
      console.log(e);
    }


  })
});
