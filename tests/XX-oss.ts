import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple, initIdlToChain } from "./utils/utils";
import { assert } from "chai";
import { convertBmpToPng } from "./utils/image";

describe.only("Create a new OSS Mint", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const payer = Keypair.generate();

    const program = anchor.workspace.Bmp as Program<Bmp>;

    before(async () => {
        await initIdlToChain();
        await airdropToMultiple([payer.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
    });


    it.skip("Creates an OSS NFT", async () => {
        const asset = Keypair.generate();
        try {
            const tx = await program.methods.ossCreate()
                .accounts({
                    payer: payer.publicKey,
                    asset: asset.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
                })
                .signers([payer, asset])
                .rpc();
            console.log('tx', tx);
            // wait 5 seconds due to some delay 
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log('asset', asset.publicKey.toBase58());
            const { data } = await provider.connection.getAccountInfo(asset.publicKey);
            const offset = 168 + 16; // asset fixed header + blob extension header
            const blob_size = 3126;  // size of 32x32 bmp
            const buffer = Buffer.from(data).subarray(offset, offset + blob_size);

            const filePaths = {
                png: `./img-outputs/oss/test.png`,
            }

            await convertBmpToPng(buffer, filePaths.png);


        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });

    it("Creates an OSS NFT w/ 2 ix", async () => {
        const asset = Keypair.generate();
        try {
            const ixBlob = await program.methods.ossCreateBlob()
                .accounts({
                    payer: payer.publicKey,
                    asset: asset.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
                })
                .instruction();


            const ixRestrict = await program.methods.ossCreateRest()
                .accounts({
                    payer: payer.publicKey,
                    asset: asset.publicKey,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
                })
                .instruction();
            const tx = new anchor.web3.Transaction().add(ixBlob).add(ixRestrict);
            const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer, asset);
            const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [payer, asset]);
            console.log('asset', asset.publicKey.toBase58());
            assert.ok(sig, 'should have signature');

        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });


});
