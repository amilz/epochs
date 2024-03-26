import { PublicKey, Transaction, SystemProgram, ComputeBudgetProgram } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import {
    AUTHORITY,
    CREATOR1_WALLET,
    CREATOR2_WALLET,
    DAO_TREASURY,
    NIFTY_PROGRAM_ID,
    SYSTEM_PROGRAM,
    getAuctionEscrowPda,
    getAuctionPda,
    getAuthorityPda,
    getCollectionMintPda,
    getNftMintPda,
    getReputationPda,
    getTimeMachinePda,
    getTimeMachineReceiptPda
} from "../utils";
import { Epochs } from "../utils";
import { ApiError, SolanaQueryType, SolanaTxType } from "../errors";
import { COMPUTE_BUDGET } from "../utils/constants/computeBudget";

interface AuctionBidParams {
    bidAmount: number;
    epoch: number;
    bidder: PublicKey;
    highBidder: PublicKey;
}

interface CreateGroupParams {
    payer: PublicKey;
}

interface InitEpochAssetParams {
    epoch: number;
    payer: PublicKey;
}

interface ClaimParams {
    epoch: number;
    winner: PublicKey;
}

interface CreateMinterParams {
    itemsAvailable: number;
    startTime: number;
}

interface ClaimFromMinterParams {
    payer: PublicKey;
}

interface RedeemFromMinterParams {
    payer: PublicKey;
}


export class TransactionBuilder {
    private program: Program<Epochs>;

    constructor(program: Program<Epochs>) {
        this.program = program;
    }

    public async createBid({
        epoch,
        bidAmount,
        bidder,
        highBidder,
    }: AuctionBidParams): Promise<Transaction> {
        const auctionPda = getAuctionPda(epoch, this.program);
        const reputation = getReputationPda(bidder, this.program);
        const auctionEscrow = getAuctionEscrowPda(this.program);
        const accounts = {
            bidder,
            highBidder,
            auctionEscrow,
            auction: auctionPda,
            reputation,
            systemProgram: SYSTEM_PROGRAM,
        };

        const args = {
            epoch: new BN(epoch),
            bidAmount: new BN(bidAmount),
        };

        try {
            const instruction = await this.program.methods
                .auctionBid(args.epoch, args.bidAmount)
                .accountsStrict(accounts)
                .instruction();

            const transaction = new Transaction().add(instruction);
            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

    public async createGroup({
        payer
    }: CreateGroupParams): Promise<Transaction> {
        const groupAsset = getCollectionMintPda(this.program);
        const groupAuthority = getAuthorityPda(this.program);

        const accounts = {
            payer: payer,
            asset: groupAsset,
            authority: groupAuthority,
            systemProgram: SystemProgram.programId,
            ossProgram: NIFTY_PROGRAM_ID,
        };
        try {
            const instruction = await this.program.methods.createGroup()
                .accounts(accounts)
                .instruction();
            const transaction = new Transaction().add(instruction);
            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }

    }

    public async initEpochAsset({
        epoch,
        payer,
    }: InitEpochAssetParams): Promise<Transaction> {
        const asset = getNftMintPda(this.program, epoch);
        const auctionPda = getAuctionPda(epoch, this.program);
        const reputationPda = getReputationPda(payer, this.program);
        const groupAsset = getCollectionMintPda(this.program);
        const groupAuthority = getAuthorityPda(this.program);
        const accounts = {
            payer: payer,
            asset,
            group: groupAsset,
            authority: groupAuthority,
            systemProgram: SystemProgram.programId,
            ossProgram: NIFTY_PROGRAM_ID,
            auction: auctionPda,
            reputation: reputationPda,
        };

        const computeInstruction = ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_BUDGET.INITIALIZE_EPOCH });

        try {
            const instruction = await this.program.methods
                .createEpoch(new BN(epoch))
                .accounts(accounts)
                .instruction();

            const transaction = new Transaction()
                .add(computeInstruction)
                .add(instruction)

            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

    public async createClaim({
        epoch,
        winner,
    }: ClaimParams): Promise<Transaction> {
        const auctionPda = getAuctionPda(epoch, this.program);
        const { highBidder } = await this.program.account.auction.fetch(auctionPda);
        const auctionEscrow = getAuctionEscrowPda(this.program);
        const reputationPda = getReputationPda(highBidder, this.program);
        const asset = getNftMintPda(this.program, epoch);
        const group = getCollectionMintPda(this.program);
        const groupAuthority = getAuthorityPda(this.program);

        if (winner.toBase58() !== highBidder.toBase58()) {
            throw ApiError.solanaQueryError(SolanaQueryType.INVALID_WINNER);
        }

        const accounts = {
            winner,
            auction: auctionPda,
            auctionEscrow,
            reputation: reputationPda,
            systemProgram: SystemProgram.programId,
            daoTreasury: DAO_TREASURY,
            creator1Wallet: CREATOR1_WALLET,
            creator2Wallet: CREATOR2_WALLET,
            asset,
            authority: groupAuthority,
            ossProgram: NIFTY_PROGRAM_ID,
            group
        };

        try {
            const instruction = await this.program.methods.auctionClaim(new BN(epoch))
                .accounts(accounts)
                .instruction();
            const transaction = new Transaction().add(instruction);
            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

    public async createTimeMachine({
        itemsAvailable,
        startTime,
    }: CreateMinterParams): Promise<Transaction> {
        const accounts = {
            authority: AUTHORITY,
            timeMachine: getTimeMachinePda(this.program),
            systemProgram: SystemProgram.programId,
        };

        try {

            const instruction = await this.program.methods.timeMachineInit(new BN(itemsAvailable), new BN(startTime))
                .accounts(accounts)
                .instruction();

            const transaction = new Transaction().add(instruction);
            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

    public async attemptTimeMachine({
        payer
    }: ClaimFromMinterParams): Promise<Transaction> {
        const accounts = {
            payer,
            timeMachine: getTimeMachinePda(this.program),
            receipt: getTimeMachineReceiptPda(this.program, payer),
            creator1Wallet: CREATOR1_WALLET,
            creator2Wallet: CREATOR2_WALLET,
            systemProgram: SystemProgram.programId,
        };

        try {
            const instruction = await this.program.methods.timeMachineAttempt()
                .accounts(accounts)
                .instruction();

            const transaction = new Transaction().add(instruction);
            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

    public async redeemFromTimeMachine({
        payer
    }: RedeemFromMinterParams): Promise<Transaction> {
        const timeMachineReceipt = getTimeMachineReceiptPda(this.program, payer);
        const claim = await this.program.account.timeMachineReceipt.fetch(timeMachineReceipt);

        const accounts = {
            asset: getNftMintPda(this.program, claim.epoch.toNumber()),
            payer: payer,
            group: getCollectionMintPda(this.program),
            authority: getAuthorityPda(this.program),
            receipt: timeMachineReceipt,
            systemProgram: SystemProgram.programId,
            ossProgram: NIFTY_PROGRAM_ID
        };

        try {
            const instruction = await this.program.methods.timeMachineClaim()
                .accounts(accounts)
                .instruction();

            const transaction = new Transaction()
                .add(instruction);

            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

}
