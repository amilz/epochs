import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple, initIdlToChain } from "./utils/utils";
import { assert } from "chai";
import { convertBmpToPng } from "./utils/image";
import { EpochClient } from "@epochs/api";
import { getAuthorityPda, getCollectionMintPda } from "@epochs/api/utils";

describe.only("Create a new OSS Mint", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const payer = Keypair.generate();
    const program = anchor.workspace.Bmp as Program<Bmp>;

    const groupAsset = getCollectionMintPda(program);
    const groupAuthority = getAuthorityPda(program);


    before(async () => {
        await initIdlToChain();
        await airdropToMultiple([payer.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
    });

    it("Creats a group OSS NFT", async () => {

        const accounts = {
            payer: payer.publicKey,
            asset: groupAsset,
            authority: groupAuthority,
            systemProgram: anchor.web3.SystemProgram.programId,
            ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
        };
        const tableData = Object.entries(accounts).map(([key, publicKey]) => ({
            account: key,
            mint: publicKey.toBase58()
        }));
        console.table(tableData);


        try {
            const ix = await program.methods.ossCreateGroup()
                .accounts(accounts)
                .instruction();

            const tx = new anchor.web3.Transaction().add(ix);
            const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer);
            const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [payer]);

            console.log('asset', groupAsset.toBase58());
            console.log('txid', sig);
            assert.ok(sig, 'should have signature');
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
                    group: groupAsset,
                    authority: groupAuthority,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
                })
                .instruction();


            const ixRestrict = await program.methods.ossCreateRest()
                .accounts({
                    payer: payer.publicKey,
                    asset: asset.publicKey,
                    group: groupAsset,
                    authority: groupAuthority,
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
            console.log('sig', sig);
            assert.ok(sig, 'should have signature');

        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });


});
