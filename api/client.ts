import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { Bmp, IDL } from "./utils/idl";
import { EPOCH_PROGRAM_ID } from "./utils";

interface EpochClientArgs {
    connection: Connection;
    wallet?: Wallet;
}

export class EpochClient {
    private readonly program: Program<Bmp>;

    private constructor({connection, wallet = {} as Wallet}: EpochClientArgs) {
        const provider: AnchorProvider = new AnchorProvider(
            connection,
            wallet,
            { commitment: 'confirmed', preflightCommitment: 'confirmed' }
        );
        const program: Program<Bmp> = new Program(
            IDL as unknown as Bmp,
            EPOCH_PROGRAM_ID,
            provider
        );
        this.program = program;
    }

    public static from(args: EpochClientArgs): EpochClient {
        return new EpochClient(args);
    }


    // TODO: Add methods for interacting with the program
}