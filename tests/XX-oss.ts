import { Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple, initIdlToChain } from "./utils/utils";
import { assert } from "chai";
import { convertBmpToPng } from "./utils/image";
import { EpochClient } from "@epochs/api";
import { getAuctionPda, getAuthorityPda, getCollectionMintPda, getNftMintPda, getReputationPda } from "@epochs/api/utils";

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
        const asset = getNftMintPda(program, 0);
        const auctionPda = getAuctionPda(0, program);
        const reputationPda = getReputationPda(payer.publicKey, program);

        const accounts = {
            payer: payer.publicKey,
            asset,
            group: groupAsset,
            authority: groupAuthority,
            systemProgram: anchor.web3.SystemProgram.programId,
            ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
        };

        const auctionAccounts = {
            payer: payer.publicKey,
            auction: auctionPda,
            reputation: reputationPda,
            asset,
            systemProgram: anchor.web3.SystemProgram.programId,
        };
        

        //printTableData(accounts);

        try {
            const ixBlob = await program.methods.ossCreateBlob(new anchor.BN(0))
                .accounts(accounts)
                .instruction();

            const ixRestrict = await program.methods.ossCreateRest(new anchor.BN(0))
                .accounts(accounts)
                .instruction();

            const ixAuction = await program.methods.ossInitAuction(new anchor.BN(0))
                .accounts(auctionAccounts)
                .instruction();

            const tx = new anchor.web3.Transaction().add(ixBlob).add(ixRestrict).add(ixAuction);
            const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer);
            const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [payer]);
            console.log('asset', asset.toBase58());
            console.log('sig', sig);
            assert.ok(sig, 'should have signature');

        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });


});


function printTableData(accounts: Record<string, anchor.web3.PublicKey>) {
    const tableData = Object.entries(accounts).map(([key, publicKey]) => ({
        account: key,
        mint: publicKey.toBase58()
    }));
    console.table(tableData);
}