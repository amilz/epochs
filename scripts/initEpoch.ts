import { EpochClient } from "@epochs/api";
import { Connection, clusterApiUrl, Keypair, sendAndConfirmTransaction } from "@solana/web3.js";

async function main() {
    const epochClient = EpochClient.from(new Connection(clusterApiUrl('devnet')));
    const secret = []
    const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));
    console.log("Wallet Public Key: ", wallet.publicKey.toBase58());
    const balance = await epochClient.connection.getBalance(wallet.publicKey);
    console.log("Wallet Balance: ", balance);

    try {
        const tx = await epochClient.createInitEpochTransaction({ payer: wallet.publicKey });
        const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.sign(wallet);
        // Act
        let sig = await sendAndConfirmTransaction(epochClient.connection, tx, [wallet], {skipPreflight: true});
        console.log("Transaction Signature: ", sig);
    } catch (error) {
        console.error(error);
    }
}

main();
