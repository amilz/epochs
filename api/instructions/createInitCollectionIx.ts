import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";
import { SYSTEM_PROGRAM, SYSVAR_RENT_PUBKEY, getAuthorityPda, getCollectionMintPda, getWnsAccounts } from "../utils";
import { Bmp } from "../utils";
import { WNS_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "../utils";
import { ApiError, SolanaTxType } from "../errors";

interface createCollectionParams {
    program: Program<Bmp>;
    payer: PublicKey;
}

export async function createInitCollectionIx({
    program,
    payer,
}: createCollectionParams): Promise<TransactionInstruction> {
    const authority = getAuthorityPda(program);
    const mint = getCollectionMintPda(program);
    const authorityAta = getAssociatedTokenAddressSync(
        mint,
        authority,
        true,
        TOKEN_2022_PROGRAM_ID
    );
    const { manager, groupAccount } = getWnsAccounts(mint);

    const accounts = {
        payer,
        authority,
        receiver: authority,
        group: groupAccount,
        mint,
        mintTokenAccount: authorityAta,
        manager,
        systemProgram: SYSTEM_PROGRAM,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        wnsProgram: WNS_PROGRAM_ID
    };

    try {
        const instruction = await program.methods
            .createCollectionNft()
            .accountsStrict(accounts)
            .instruction();
        return instruction;
    } catch (error) {
        throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
    }


}