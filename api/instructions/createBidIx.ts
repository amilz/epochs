import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import {
    SYSTEM_PROGRAM,
    getAuctionEscrowPda,
    getAuctionPda,
    getReputationPda,
    Bmp
} from "../utils";
import { ApiError, SolanaTxType } from "../errors";

interface AuctionBidParams {
    bidAmount: number;
    epoch: number;
    program: Program<Bmp>;
    bidder: PublicKey;
    highBidder: PublicKey;
}

export async function createBidIx({
    epoch,
    bidAmount,
    program,
    bidder,
    highBidder,
}: AuctionBidParams): Promise<TransactionInstruction> {
    const auctionPda = getAuctionPda(epoch, program);
    const reputation = getReputationPda(bidder, program);
    const auctionEscrow = getAuctionEscrowPda(program);
    const accounts = {
        bidder: bidder,
        highBidder,
        auctionEscrow,
        auction: auctionPda,
        reputation,
        systemProgram: SYSTEM_PROGRAM,
    }
    
    const args = {
        epoch: new BN(epoch),
        bidAmount: new BN(bidAmount)
    }

    try {
        const instruction = program.methods
            .bid(args.epoch, args.bidAmount)
            .accountsStrict(accounts)
            .instruction();
        return instruction;
    } catch (error) {
        throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
    }
}