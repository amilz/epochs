import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { AnchorError, Program } from "@coral-xyz/anchor";
import { getAuthorityPda, getCollectionMintPda, getWnsAccounts } from "../pdas";
import { assert } from "chai";
import { Bmp } from "../../../target/types/bmp";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { WNS_PROGRAM_ID } from "../consts";
import { AllInstructions } from "@coral-xyz/anchor/dist/cjs/program/namespace/types";
import { PartialAccounts } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";

type AllMyInstructions = AllInstructions<Bmp>;
type PartialCollectionNftInstructionAccounts = PartialAccounts<Extract<AllMyInstructions, { name: "createCollectionNft" }>["accounts"][number]>;

interface createCollectionParams {
    program: Program<Bmp>;
    payer: Keypair;
    logMintInfo?: boolean;
    expectToFail?: {
        errorCode: string;
        assertError?: (error: any) => void;
    };
    accountOverrides?: PartialCollectionNftInstructionAccounts;
}

export async function createCollection({
    program,
    payer,
    logMintInfo = false,
    expectToFail,
    accountOverrides = {} // Default to an empty object if not provided
}: createCollectionParams) {
    const computeInstruction = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 140_000 });
    const authority = getAuthorityPda(program);
    const mint = getCollectionMintPda(program);
    const authorityAta = getAssociatedTokenAddressSync(
        mint,
        authority,
        true,
        TOKEN_2022_PROGRAM_ID
    );
    const { manager, groupAccount } = getWnsAccounts(mint);

    const defaultAccounts = {
        payer: payer.publicKey,
        authority,
        receiver: authority,
        group: groupAccount,
        mint: mint,
        mintTokenAccount: authorityAta,
        manager,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        wnsProgram: WNS_PROGRAM_ID
    };

    const accounts = { ...defaultAccounts, ...accountOverrides };

    const txRequest = program.methods.createCollectionNft()
        .accounts(accounts)
        .signers([payer])
        .preInstructions([computeInstruction])
        .rpc();

    try {

        const signature = await txRequest;
        const { blockhash, lastValidBlockHeight } = await program.provider.connection.getLatestBlockhash();
        await program.provider.connection.confirmTransaction({signature, blockhash, lastValidBlockHeight }, 'confirmed');
        assert.ok(signature, "tx should confirm");
        if (logMintInfo) console.log(`   Collection NFT signature: ${signature}`);

    } catch (error) {
        //console.error(`Error minting collection NFT`, error);
        if (expectToFail) {
            if (expectToFail.assertError) {
                expectToFail.assertError(error);
            } else {
                assert.isTrue(error instanceof AnchorError, "Expected an AnchorError");
                assert.strictEqual(error.error.errorCode.code, expectToFail.errorCode, `Expected error code ${expectToFail.errorCode}`);
            }
            return;
        }
        throw error;
    }
}