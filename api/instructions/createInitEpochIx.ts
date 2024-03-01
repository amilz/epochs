import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Program, BN } from "@coral-xyz/anchor";
import { 
    SYSTEM_PROGRAM, SYSVAR_RENT_PUBKEY, 
    getAuctionPda, getAuthorityPda, getCollectionMintPda, getEpochInscriptionPda, getNftMintPda, getReputationPda, getWnsAccounts } from "../utils";
import { Bmp } from "../utils";
import { WNS_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "../utils";
import { ApiError, SolanaTxType } from "../errors";

interface MintAssetsForEpochParams {
    epoch: number;
    program: Program<Bmp>;
    payer;
}

export async function createInitEpochIx({
    epoch,
    program,
    payer,
}: MintAssetsForEpochParams): Promise<TransactionInstruction> {
    const auctionPda = getAuctionPda(epoch, program);
    const reputation = getReputationPda(payer, program);
    const authority = getAuthorityPda(program);
    const epochInscriptionPda = getEpochInscriptionPda(epoch, program);
    const mint = getNftMintPda(program, epoch);
    const collectionMint = getCollectionMintPda(program);
    const { groupAccount } = getWnsAccounts(collectionMint);

    const auctionAta = getAssociatedTokenAddressSync(
        mint,
        auctionPda,
        true,
        TOKEN_2022_PROGRAM_ID
    );
    const { manager, extraMetasAccount, memberAccount } = getWnsAccounts(mint);

    const accounts = {
        payer: payer,
        auction: auctionPda,
        reputation,
        mint,
        authority,
        epochInscription: epochInscriptionPda,
        auctionAta,
        extraMetasAccount,
        manager,
        group: groupAccount,
        member: memberAccount,
        systemProgram: SYSTEM_PROGRAM,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        wnsProgram: WNS_PROGRAM_ID
    };

    const args = new BN(epoch);

    try {
        const instruction = await program.methods
            .initEpoch(args)
            .accountsStrict(accounts)
            .instruction();
        return instruction;
    } catch (error) {
        throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
    }
}