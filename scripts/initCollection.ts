import { EpochClient } from "@epochs/api";
import { Connection, clusterApiUrl, Keypair, sendAndConfirmTransaction } from "@solana/web3.js";

const endpoint = 'https://testnet.dev2.eclipsenetwork.xyz/'

async function main() {
    const epochClient = EpochClient.from(new Connection(endpoint));
    // DO NOTE USE FOR PROD. JUST A KEY FOR LOCAL TESTING
    const secret = [94,44,72,208,232,104,115,140,245,158,169,224,96,190,115,177,110,139,44,82,27,97,34,9,244,6,63,153,179,9,52,237,140,193,150,10,101,97,216,226,3,254,237,157,208,113,74,69,108,5,141,151,133,82,17,148,88,9,36,157,150,155,25,29];
    
    const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));
    console.log("Wallet Public Key: ", wallet.publicKey.toBase58());
    return;
    const balance = await epochClient.connection.getBalance(wallet.publicKey);
    console.log("Wallet Balance: ", balance);

    try {
        const tx = await epochClient.createGroupTransaction({ payer: wallet.publicKey });
        const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.sign(wallet);
        // Act
        let sig = await sendAndConfirmTransaction(epochClient.connection, tx, [wallet], { skipPreflight: true });
        console.log("Transaction Signature: ", sig);
    } catch (error) {
        console.error(error);
    }
}

main();
