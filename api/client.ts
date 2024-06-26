import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Transaction, PublicKey, Commitment, GetProgramAccountsFilter } from "@solana/web3.js";
import { Epochs, IDL } from "./utils/idl/epochs";
import { EPOCH_PROGRAM_ID, NIFTY_PROGRAM_ID, getAuctionEscrowPda, getAuctionPda, getAuthorityPda, getCollectionMintPda, getNftMintPda, getReputationPda, getTimeMachinePda } from "./utils";
import { ApiError, SolanaQueryType } from "./errors";
import { TransactionBuilder } from './transactionBuilder';
import { Asset } from "./utils/deserialize/deserialize";
import { Auction } from "./utils/types";
import { COLLECTION_OFFSET, EPOCH_SIZE, OWNER_OFFSET } from "./utils/constants/deserializers";

interface EpochClientArgs {
    connection: Connection;
    wallet?: Wallet; // Leaving this optional for now (I do not think we will need it) #TODO
}

export class EpochClient {
    private readonly program: Program<Epochs>;
    public readonly connection: Connection;
    private txBuilder: TransactionBuilder;

    private constructor({ connection, wallet = {} as Wallet }: EpochClientArgs) {
        const provider: AnchorProvider = new AnchorProvider(
            connection,
            wallet,
            // TODO add override options
            AnchorProvider.defaultOptions()
        );
        const program: Program<Epochs> = new Program(
            IDL as unknown as Epochs,
            EPOCH_PROGRAM_ID,
            provider
        );
        this.program = program;
        this.connection = connection;
        this.txBuilder = new TransactionBuilder(program);
    }

    public static from(connection: Connection): EpochClient {
        return new EpochClient({ connection });
    }

    public static local(): EpochClient {
        // TODO Mimic https://github.com/coral-xyz/anchor/blob/2f552a17f5e4cb0f5b075240c2645b6485e59752/ts/packages/anchor/src/provider.ts#L87
        return new EpochClient({ connection: new Connection("http://localhost:8899", 'processed') });
    }

    public async getCurrentEpoch(): Promise<number> {
        const { epoch } = await this.program.provider.connection.getEpochInfo();
        return epoch;
    }

    public async getCurrentEpochInfo() {
        const epochInfo = await this.program.provider.connection.getEpochInfo();
        return epochInfo;
    }

    public async isCurrentAuctionActive(): Promise<boolean> {
        const epoch = await this.getCurrentEpoch();
        try {
            const auction = await this.fetchAuction({ epoch });
            if (!auction) { return false }
            return true;
        } catch (error) {
            return false;
        }
    }

    public async createGroupTransaction({ payer }: { payer: PublicKey }): Promise<Transaction> {
        const transaction = await this.txBuilder.createGroup({ payer });
        return transaction;
    }

    public async createInitEpochTransaction({ payer }: { payer: PublicKey }): Promise<Transaction> {
        const epoch = await this.getCurrentEpoch();
        const transaction = await this.txBuilder.initEpochAsset({ epoch, payer });
        return transaction;
    }

    public async createBidTransaction({ bidAmount, bidder }: {
        bidAmount: number,
        bidder: PublicKey,
    }): Promise<Transaction> {
        const epoch = await this.getCurrentEpoch();
        const { highBidder } = await this.fetchAuction({ epoch });
        const transaction = await this.txBuilder.createBid({ bidAmount, epoch, bidder, highBidder });
        return transaction;
    }

    public async createClaimInstruction({ winner, epoch }: {
        winner: PublicKey,
        epoch: number
    }): Promise<Transaction> {
        await this.verifyEpochHasPassed(epoch);
        const transaction = await this.txBuilder.createClaim({ epoch, winner });
        return transaction;
    }

    public async createTimeMachineInitInstruction({ itemsAvailable, startTime }: {
        itemsAvailable: number,
        startTime: number
    }): Promise<Transaction> {
        const transaction = await this.txBuilder.createTimeMachine({ itemsAvailable, startTime });
        return transaction;
    }

    public async createTimeMachineAttemptInstruction({ payer }: {
        payer: PublicKey
    }): Promise<Transaction> {
        const transaction = await this.txBuilder.attemptTimeMachine({ payer });
        return transaction;
    }

    public async createRedeemFromTimeMachineInstruction({ payer }: {
        payer: PublicKey
    }): Promise<Transaction> {
        const transaction = await this.txBuilder.redeemFromTimeMachine({ payer });
        return transaction;
    }

    private async verifyEpochHasPassed(epoch: number): Promise<void> {
        const currentEpoch = await this.getCurrentEpoch();
        if (epoch < currentEpoch) {
            return Promise.resolve();
        } else {
            return Promise.reject(ApiError.solanaQueryError(SolanaQueryType.INVALID_EPOCH));
        }
    }

    public async fetchAuction({ epoch, commitment = 'confirmed' }: { epoch: number, commitment?: Commitment }) {
        const auction = getAuctionPda(epoch, this.program);
        const data = await this.program.account.auction.fetch(auction, commitment);
        return data;
    }

    public async fetchReputation({ user }: { user: PublicKey }) {
        const reputation = getReputationPda(user, this.program);
        const data = await this.program.account.reputation.fetch(reputation);
        return data;
    }

    public async fetchDeserializedAssetByEpoch({ epoch }: { epoch: number }) {
        const asset = getNftMintPda(this.program, epoch);
        const { data } = await this.program.provider.connection.getAccountInfo(asset);
        const deserializedAsset = Asset.deserialize(data);

        return deserializedAsset;
    }

    public async fetchCurrenAuctionDetails() {
        const epoch = await this.getCurrentEpoch();
        try {
            const auction = await this.fetchAuction({ epoch });
            if (!auction) { throw ApiError.solanaQueryError(SolanaQueryType.AUCTION_NOT_INITIALIZED) }
            return auction as Auction;
        } catch (error) {
            throw ApiError.solanaQueryError(SolanaQueryType.AUCTION_NOT_INITIALIZED);
        }
    }

    public async fetchAssetAndImageByEpoch({ epoch }: { epoch: number }) {
        const deserializedAsset = await this.fetchDeserializedAssetByEpoch({ epoch });
        const { extensions, ...assetWithoutExtensions } = deserializedAsset;
        const png = await deserializedAsset.fetchBase64Png();
        return { epoch, extensions, assetWithoutExtensions, png };
    }

    public async fetchMinterDetails() {
        const timeMachine = getTimeMachinePda(this.program);
        const data = await this.program.account.timeMachine.fetch(timeMachine);
        return data;
    }

    public fetchGroupPda() {
        return getCollectionMintPda(this.program);
    }

    public fetchAuthorityPda() {
        return getAuthorityPda(this.program);
    }

    public fetchAuctionEscrowPda() {
        return getAuctionEscrowPda(this.program);
    }

    public fetchAssetAddress({ epoch }: { epoch: number }) {
        return getNftMintPda(this.program, epoch);
    }

    public async fetchDeserializedGroupAsset() {
        const asset = this.fetchGroupPda();
        const { data } = await this.program.provider.connection.getAccountInfo(asset);
        const deserializedAsset = Asset.deserialize(data);

        return deserializedAsset;
    }

    public async fetchDeserializedAssetsByPublicKey({ assets }: { assets: PublicKey[] }) {
        const infos = await this.connection.getMultipleAccountsInfo(assets);
        const deserializedAssets = infos.map(({ data }) => Asset.deserialize(data));

        const promises = deserializedAssets.map(async (deserializedAsset) => {
            const { extensions, ...assetWithoutExtensions } = deserializedAsset;
            const png = await deserializedAsset.fetchBase64Png();
            return { assetWithoutExtensions, extensions, png };
        });
        const assetsAndPng = await Promise.all(promises);

        return assetsAndPng;
    }

    public async fetchEpochsByOwner({ owner }: { owner: PublicKey }) {
        const group = getCollectionMintPda(this.program);
        let filters: GetProgramAccountsFilter[] = [
            {
                memcmp: {
                    offset: OWNER_OFFSET,
                    bytes: owner.toBase58()
                }
            },
            {
                memcmp: {
                    offset: COLLECTION_OFFSET,
                    bytes: group.toBase58()
                }
            },
            { dataSize: EPOCH_SIZE }
        ];
        try {
            const assets = await this.connection.getProgramAccounts(NIFTY_PROGRAM_ID, { filters });
            const deserialized = await this.fetchDeserializedAssetsByPublicKey({ assets: assets.map(({ pubkey }) => pubkey) });
            return deserialized;
        } catch (error) {
            console.error('Failed to fetch Nifty assets:', error);
            throw error;
        }
    }

    public isClaimed(auction: Auction): boolean {
        return 'claimed' in auction.state;
    };

}

// TODO: Add methods for interacting with the program
// e.g., validate bid amount
