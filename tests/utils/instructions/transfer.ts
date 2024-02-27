import { Program } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, createTransferCheckedWithTransferHookInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Bmp } from "../../../target/types/bmp";
import { Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getAuctionPda } from "../pdas";
import { assert } from "chai";

interface transferParams {
    program: Program<Bmp>;
    epoch: number;
    owner: Keypair;
    destinationOwner: Keypair;
}

export async function transferNft({
    program,
    epoch,
    owner,
    destinationOwner
}: transferParams) {

    const auction = getAuctionPda(epoch, program);
    const { mint } = await program.account.auction.fetch(auction);
    const sourceAccount = getAssociatedTokenAddressSync(mint, owner.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const destination = getAssociatedTokenAddressSync(mint, destinationOwner.publicKey, false, TOKEN_2022_PROGRAM_ID);

    try {
        const createTaIx = createAssociatedTokenAccountInstruction(
            owner.publicKey,
            destination,
            destinationOwner.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID,
        );

        const instruction = await createTransferCheckedWithTransferHookInstruction(
            program.provider.connection,
            sourceAccount,
            mint,
            destination,
            owner.publicKey,
            BigInt(1),
            0,
            [],
            "confirmed",
            TOKEN_2022_PROGRAM_ID,
        )

        const transaction = new Transaction().add(createTaIx).add(instruction);

        const txId = await sendAndConfirmTransaction(
            program.provider.connection,
            transaction,
            [owner],
            { skipPreflight: true }
        );
        assert.ok(txId, "Expected transfer to succeed");
    } catch (err) {
        console.log(err);
        assert.fail("Expected transfer to succeed", err);
    }

};

export async function transferNftWithCpi({
    program,
    epoch,
    owner,
    destinationOwner
}: transferParams) {
    const auction = getAuctionPda(epoch, program);
    const { mint } = await program.account.auction.fetch(auction);
    const sourceAccount = getAssociatedTokenAddressSync(mint, owner.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const destination = getAssociatedTokenAddressSync(mint, destinationOwner.publicKey, false, TOKEN_2022_PROGRAM_ID);

    try {

        const createTaIx = createAssociatedTokenAccountInstruction(
            owner.publicKey,
            destination,
            destinationOwner.publicKey,
            mint,
            TOKEN_2022_PROGRAM_ID,
        );
        const instruction = await program.methods.transferExample().accounts({
            owner: owner.publicKey,
            receiver: destinationOwner.publicKey,
            mint,
            sourceAta: sourceAccount,
            destinationAta: destination,
            tokenProgram: TOKEN_2022_PROGRAM_ID
        }).instruction();

        // TODO: I Think i need to add an approve ix here
        // Otherwise, we're not really testing the CPI Failure
        // for the right reasons. RN it's just failing b/c 
        // not all accounts are provided
        
        const transaction = new Transaction().add(createTaIx).add(instruction);

        await sendAndConfirmTransaction(
            program.provider.connection,
            transaction,
            [owner],
            { skipPreflight: true }
        );
        assert.fail("Expected CPI Transfer to fail");
    } catch (err) {
        assert.ok(err, "Expected CPI Transfer to fail");
    }
}