import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple, initIdlToChain } from "./utils/utils";
import { assert } from "chai";

describe.only("Create a new OSS Mint", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const payer = Keypair.generate();

    const program = anchor.workspace.Bmp as Program<Bmp>;

    before(async () => {
        await initIdlToChain();
        await airdropToMultiple([payer.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
    });


    it("Creates a collection nft", async () => {
        const asset = Keypair.generate();
        try {
            program.methods.ossCreate()
                .accounts({
                    payer: payer.publicKey,
                    asset: asset.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
                })
                .signers([payer, asset])
                .rpc();

        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });

});
