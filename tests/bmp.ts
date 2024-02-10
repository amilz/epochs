
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
      await mintTest();
    } catch (e) {
      console.log(e);
    }
  });

  const slotsPerEpoch = 32;
  let numNfts = 0;
  const ws = program.provider.connection.onSlotChange(async ({ slot }) => {
    // if epoch changes, mint a new NFT
    //console.log("slot", slot);
    if (slot % slotsPerEpoch === 0) {
      console.log("SIMULATING NEW EPOCH - MINTING NFT");
      await mintTest();
    
    }
  });

  async function mintTest () {
    //it("Mints an NFT", async () => {
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
        const inscription = await program.provider.connection.getAccountInfo(mintInscriptionAccount);
        const filePath = `./img-outputs/${numNfts}.bmp`;
        fs.writeFileSync(filePath, inscription.data);
        exec(`open ${filePath}`, (error, _stdout, _stderr) => {
          if (error) {
            console.error(`Error opening file: ${error}`);
          }
        });
        numNfts++;
        if (numNfts > 100) {
          await program.provider.connection.removeSlotChangeListener(ws);
        }
  
      } catch (e) {
        console.log(e);
      }
  
  
    //})
  }



});
