

import { EpochClient } from "@epochs/api";
import { Connection, clusterApiUrl, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";

async function main() {
    const epochClient = EpochClient.from(new Connection(clusterApiUrl('devnet')));
    const epoch = 668;
    const address = "3T92AVGqBpe4UrJX7Np1pS9Egv9D2jJyMVXxacHrxtcJ";
    // const asset = new PublicKey(address);

    try {
        // const asset = await epochClient.fetchAssetAndImageByEpoch( { epoch })
        const deserializedAsset = await epochClient.fetchDeserializedAssetByEpoch({ epoch });
        deserializedAsset.saveImg();
    } catch (error) {
        console.error(error);
    }
}

main();
