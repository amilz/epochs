import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, TransactionInstruction, PublicKey } from "@solana/web3.js";
import { Bmp, IDL } from "./utils/idl";
import { EPOCH_PROGRAM_ID } from "./utils";
import { createInitCollectionIx } from "./instructions/createInitCollectionIx";
import { createInitEpochIx } from "./instructions/createInitEpochIx";
import { createBidIx } from "./instructions/createBidIx";

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

    // TODO: Add methods for interacting with the program

}