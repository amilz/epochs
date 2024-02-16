// In a new file, e.g., `helpers/mintHelper.ts`
import { Keypair, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getAuctionPda, getEpochInscriptionPda } from "./pdas";
import fs from 'fs';
import { assert } from "chai";
import { openFile } from "./utils";
import { Bmp } from "../../target/types/bmp";

interface MintAssetsForEpochParams {
    epoch: number;
    program: Program<Bmp>;
    user: Keypair;
    disableOpenFile?: boolean;
    logMintInfo?: boolean;
}

export async function mintAssetsForEpoch({ epoch, program, user, disableOpenFile = true, logMintInfo = false}: MintAssetsForEpochParams) {
    const auctionPda = getAuctionPda(epoch, program);
    const epochInscriptionPda = getEpochInscriptionPda(epoch, program);
    const computeInstruction = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 });

    const mintInstruction = await program.methods.mintNft(new anchor.BN(epoch))
        .accounts({
            user: user.publicKey,
            epochInscription: epochInscriptionPda,
            auction: auctionPda,
        })
        .instruction();

    const transaction = new Transaction()
        .add(computeInstruction)
        .add(mintInstruction);

    try {
        const signature = await anchor.web3.sendAndConfirmTransaction(program.provider.connection, transaction, [user]);
        if (logMintInfo) console.log(`   Epoch ${epoch} - mintNft signature: ${signature}`);

        const data = await program.account.epochInscription.fetch(epochInscriptionPda);
        assert.ok(data.buffer.rawData.length > 0);

        const filePath = `./img-outputs/nouns/z-epoch-${epoch}.bmp`;
        fs.writeFileSync(filePath, data.buffer.rawData);

        if (!disableOpenFile) {
            openFile(filePath);
        }
    } catch (error) {
        console.error(`Error during minting for epoch ${epoch}:`, error);
    }
}