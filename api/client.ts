import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, TransactionInstruction, PublicKey } from "@solana/web3.js";
import { Bmp, IDL } from "./utils/idl";
import { EPOCH_PROGRAM_ID, getAuctionPda, getEpochInscriptionPda, getNftMintPda, getReputationPda } from "./utils";
import { createInitCollectionIx } from "./instructions/createInitCollectionIx";
import { createInitEpochIx } from "./instructions/createInitEpochIx";
import { createBidIx } from "./instructions/createBidIx";
import { ApiError, SolanaQueryType } from "./errors";
import { createClaimIx } from "./instructions/createClaimIx";
import Jimp from "jimp";

interface EpochClientArgs {
    connection: Connection;
    wallet?: Wallet; // Leaving this optional for now (I do not think we will need it) #TODO
}

export class EpochClient {
    private readonly program: Program<Bmp>;

    private constructor({ connection, wallet = {} as Wallet }: EpochClientArgs) {
        const provider: AnchorProvider = new AnchorProvider(
            connection,
            wallet,
            AnchorProvider.defaultOptions()
        );
        const program: Program<Bmp> = new Program(
            IDL as unknown as Bmp,
            EPOCH_PROGRAM_ID,
            provider
        );
        this.program = program;
    }

    public static from(connection: Connection): EpochClient {
        return new EpochClient({ connection });
    }

    private async getCurrentEpoch(): Promise<number> {
        const { epoch } = await this.program.provider.connection.getEpochInfo();
        return epoch;
    }

    public async createNewCollectionInstruction({ payer }: { payer: PublicKey }): Promise<TransactionInstruction> {
        const intruction = await createInitCollectionIx({ program: this.program, payer });
        return intruction;
    }

    public async createInitEpochInstruction({ payer }: { payer: PublicKey }): Promise<TransactionInstruction> {
        const epoch = await this.getCurrentEpoch();
        const instruction = await createInitEpochIx({ epoch, program: this.program, payer });
        return instruction;
    }

    public async createBidInstruction({ bidAmount, bidder, highBidder }: {
        bidAmount: number,
        bidder: PublicKey,
        highBidder: PublicKey
    }): Promise<TransactionInstruction> {
        const epoch = await this.getCurrentEpoch();
        const instruction = await createBidIx({ program: this.program, bidAmount, epoch, bidder, highBidder });
        return instruction;
    }

    public async createClaimInstruction({ winner, epoch }: {
        winner: PublicKey,
        epoch: number
    }): Promise<TransactionInstruction> {
        await this.verifyEpochHasPassed(epoch);
        const instruction = await createClaimIx({ epoch, program: this.program, winner });
        return instruction;
    }

    private async verifyEpochHasPassed(epoch: number): Promise<void> {
        const currentEpoch = await this.getCurrentEpoch();
        if (epoch < currentEpoch) {
            return Promise.resolve();
        } else {
            return Promise.reject(ApiError.solanaQueryError(SolanaQueryType.INVALID_EPOCH));
        }
    }

    public async fetchAuction({ epoch }: { epoch: number }) {
        const auction = getAuctionPda(epoch, this.program);
        const data = await this.program.account.auction.fetch(auction);
        return data;
    }

    public async fetchReputation({ user }: { user: PublicKey }) {
        const reputation = getReputationPda(user, this.program);
        const data = await this.program.account.reputation.fetch(reputation);
        return data;
    }

    public async fetchNftMintByEpoch({ epoch }: { epoch: number }) {
        await this.verifyEpochHasPassed(epoch);
        const mint = getNftMintPda(this.program, epoch);
        return mint;
    }

    public async fetchCurrenAuctionDetails() {
        const epoch = await this.getCurrentEpoch();
        try {
            const auction = await this.fetchAuction({ epoch });
            if (!auction) { throw ApiError.solanaQueryError(SolanaQueryType.AUCTION_NOT_INITIALIZED) }
            return { auction };
        } catch (error) {
            throw ApiError.solanaQueryError(SolanaQueryType.AUCTION_NOT_INITIALIZED);
        }
    }

    /**
     * Fetches an image associated with a given epoch, processes it, and returns the image
     * in a web-friendly PNG format encoded in Base64. This method is useful in web applications
     * where image data needs to be dynamically fetched and displayed, such as in a React app.
     *
     * @param params - An object containing the epoch number.
     * @param params.epoch - The epoch number for which to fetch the associated image.
     * @returns A Promise that resolves to an object containing the epoch, inscription public key,
     * raw buffer data of image and json, and the processed PNG image as a Base64-encoded string.
     *
     * @example
     * ```typescript
     *    // Assuming you have a class or service instance `yourService` where this method is defined
     *    async function displayEpochImage(epoch: number) {
     *        const { png } = await EpochClient.fetchInscriptionByEpoch({ epoch });
     *        const imageSrc = `data:image/png;base64,${png}`;
     *        // Use `imageSrc` in an <img> tag in your React component
     *        // For example:
     *        return <img src={imageSrc} alt={`Image for epoch ${epoch}`} />;
     *    }
     * ```
     */

    public async fetchInscriptionByEpoch({ epoch }: { epoch: number }) {
        const inscription = getEpochInscriptionPda(epoch, this.program);
        const { buffers } = await this.program.account.epochInscription.fetch(inscription);
        const image = await Jimp.read(buffers.imageRaw);
        image.resize(640, 640, Jimp.RESIZE_NEAREST_NEIGHBOR);
        // HELP HERE?
        const png = await image.getBase64Async(Jimp.MIME_PNG);
        return { epoch, inscription, buffers, png };
    }


}

// TODO: Add methods for interacting with the program

