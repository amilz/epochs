import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import {
    SYSTEM_PROGRAM, TOKEN_2022_PROGRAM_ID,
    getAuctionEscrowPda,
    getAuctionPda,
    getReputationPda,
    Bmp,
    getAuthorityPda,
    getWnsAccounts,
    SYSVAR_RENT_PUBKEY,
    WNS_PROGRAM_ID,
    DAO_TREASURY,
    CREATOR_WALLET,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from "../utils";
import { ApiError, SolanaQueryType, SolanaTxType } from "../errors";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

interface AuctionBidParams {
    epoch: number;
    program: Program<Bmp>;
    winner: PublicKey;
}

export async function createBidIx({
    epoch,
    program,
    winner,
}: AuctionBidParams): Promise<TransactionInstruction> {
    const auctionPda = getAuctionPda(epoch, program);
    const reputation = getReputationPda(winner, program);
    const auctionEscrow = getAuctionEscrowPda(program);
    const authority = getAuthorityPda(program);
    let mint: PublicKey;
    try {
        const auctionAccount = await program.account.auction.fetch(auctionPda);
        mint = auctionAccount.mint;
    } catch (error) {
        throw ApiError.solanaQueryError(SolanaQueryType.UNKNOWN);
    }
    const destinationAta = getAssociatedTokenAddressSync(mint, winner, false, TOKEN_2022_PROGRAM_ID);
    const sourceAta = getAssociatedTokenAddressSync(mint, auctionPda, true, TOKEN_2022_PROGRAM_ID);
    const { extraMetasAccount } = getWnsAccounts(mint);

    const accounts = {
        winner: winner,
        auction: auctionPda,
        auctionEscrow,
        reputation,
        systemProgram: SYSTEM_PROGRAM,
        daoTreasury: DAO_TREASURY,
        creatorWallet: CREATOR_WALLET,
        authority,
        mint,
        destinationAta,
        sourceAta,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        extraMetasAccount,
        rent: SYSVAR_RENT_PUBKEY,
        wnsProgram: WNS_PROGRAM_ID
    }

    const args = new BN(epoch);

    try {
        const instruction = program.methods
            .claim(args)
            .accountsStrict(accounts)
            .instruction();
        return instruction;
    } catch (error) {
        throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
    }
}