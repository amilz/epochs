import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import {
    AUTHORITY,
    CREATOR_WALLET,
    DAO_TREASURY,
    NIFTY_PROGRAM_ID,
    SYSTEM_PROGRAM,
    getAuctionEscrowPda,
    getAuctionPda,
    getAuthorityPda,
    getCollectionMintPda,
    getMinterClaimPda,
    getMinterPda,
    getNftMintPda,
    getReputationPda
} from "../utils";
import { Bmp } from "../utils"; // Assuming Bmp is correctly imported here
import { ApiError, SolanaQueryType, SolanaTxType } from "../errors";

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
    payer;
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
    private program: Program<Bmp>;

    constructor(program: Program<Bmp>) {
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
                .bid(args.epoch, args.bidAmount)
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
            const instruction = await this.program.methods.ossCreateGroup()
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
        const reputationPda = getReputationPda(payer.publicKey, this.program);
        const groupAsset = getCollectionMintPda(this.program);
        const groupAuthority = getAuthorityPda(this.program);
        const accounts = {
            payer: payer.publicKey,
            asset,
            group: groupAsset,
            authority: groupAuthority,
            systemProgram: SystemProgram.programId,
            ossProgram: NIFTY_PROGRAM_ID,
        };

        const auctionAccounts = {
            payer: payer.publicKey,
            auction: auctionPda,
            reputation: reputationPda,
            asset,
            systemProgram: SystemProgram.programId,
        };

        try {
            const instructionBlob = await this.program.methods
                .ossCreateBlob(new BN(epoch))
                .accounts(accounts)
                .instruction();

            const instructionAsset = await this.program.methods
                .ossCreateRest(new BN(epoch))
                .accounts(accounts)
                .instruction();

            const instructionAuction = await this.program.methods
                .ossInitAuction(new BN(epoch))
                .accounts(auctionAccounts)
                .instruction();

            const transaction = new Transaction()
                .add(instructionBlob)
                .add(instructionAsset)
                .add(instructionAuction);

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
            creatorWallet: CREATOR_WALLET,
            asset,
            authority: groupAuthority,
            ossProgram: NIFTY_PROGRAM_ID
        };

        try {
            const instruction = await this.program.methods.ossClaim(new BN(epoch))
                .accounts(accounts)
                .instruction();
            const transaction = new Transaction().add(instruction);
            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

    public async createMinter({
        itemsAvailable,
        startTime,
    }: CreateMinterParams): Promise<Transaction> {
        const accounts = {
            authority: AUTHORITY,
            minter: getMinterPda(this.program),
            systemProgram: SystemProgram.programId,
        };

        try {

            const instruction = await this.program.methods.ossInitMinter(new BN(itemsAvailable), new BN(startTime))
                .accounts(accounts)
                .instruction();

            const transaction = new Transaction().add(instruction);
            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

    public async claimFromMinter({
        payer
    }: ClaimFromMinterParams): Promise<Transaction> {
        const accounts = {
            payer,
            minter: getMinterPda(this.program),
            minterClaim: getMinterClaimPda(this.program, payer),
            systemProgram: SystemProgram.programId,
        };

        try {
            const instruction = await this.program.methods.ossMinterClaim()
                .accounts(accounts)
                .instruction();

            const transaction = new Transaction().add(instruction);
            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

    public async redeemFromMinter({
        payer
    }: RedeemFromMinterParams): Promise<Transaction> {
        const minterClaim = getMinterClaimPda(this.program, payer);
        const claim = await this.program.account.minterClaim.fetch(minterClaim);

        const accounts = {
            asset: getNftMintPda(this.program, claim.epoch.toNumber()),
            payer: payer,
            group: getCollectionMintPda(this.program),
            authority: getAuthorityPda(this.program),
            minterClaim: minterClaim,
            systemProgram: SystemProgram.programId,
            ossProgram: NIFTY_PROGRAM_ID
        };

        try {
            const instructionBlob = await this.program.methods.ossRedeemBlob()
                .accounts(accounts)
                .instruction();
            const instructionAsset = await this.program.methods.ossRedeemRest()
                .accounts(accounts)
                .instruction();

            const transaction = new Transaction()
                .add(instructionBlob)
                .add(instructionAsset);

            return transaction;
        } catch (error) {
            throw ApiError.solanaTxError(SolanaTxType.FAILED_TO_GENERATE_IX);
        }
    }

}
