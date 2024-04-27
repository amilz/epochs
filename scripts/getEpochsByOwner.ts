import { Connection, GetProgramAccountsFilter, GetProgramAccountsResponse, PublicKey } from "@solana/web3.js";

const ENDPOINT = 'https://testnet.dev2.eclipsenetwork.xyz/'

function getCollectionMintPda() {
    const [collectionMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("Collection")],
        EPOCH_PROGRAM_ID
    );
    return collectionMint;
}

const EPOCH_PROGRAM_ID = new PublicKey("epoZLPTE49aXQ5WLem3W3Jr2thfVgZWFJwkRJZGBsfS");
const NIFTY_PROGRAM_ID = new PublicKey("AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73");
const OWNER_PUBKEY = new PublicKey("592uobEjHVnWCp9TrBEZCsFqy8UpngEprAU9j4aoMSVa");
const GROUP_ADDRESS = getCollectionMintPda();
const EPOCH_SIZE = 3376;

interface GetNiftyAssetParams {
    connection: Connection;
    owner?: PublicKey;
    group?: PublicKey;
    dataSize?: number;
}

/**
 * Retrieves Nifty assets based on owner, group, and/or dataSize (must provide at least one).
 *
 * @param connection - The connection object used to interact with the SVM.
 * @param owner - The owner of the assets.
 * @param group - The group of the assets.
 * @param dataSize - The size of the data.
 * @returns A promise that resolves to an array of Nifty assets.
 * @throws An error if at least one of owner, group, or dataSize is not provided.
 */
async function getNiftyAssets({
    connection,
    owner,
    group,
    dataSize
}: GetNiftyAssetParams): Promise<GetProgramAccountsResponse> {
    if (!owner && !group && !dataSize) {
        throw new Error('At least one of owner, group, or dataSize must be provided.');
    }
    const OWNER_OFFSET = 4;
    const COLLECTION_OFFSET = 36;
    let filters: GetProgramAccountsFilter[] = [];
    if (owner) {
        filters.push({
            memcmp: {
                offset: OWNER_OFFSET,
                bytes: owner.toBase58()
            }
        });
    }
    if (group) {
        filters.push({
            memcmp: {
                offset: COLLECTION_OFFSET,
                bytes: group.toBase58()
            }
        });
    }
    if (dataSize) {
        filters.push({
            dataSize: dataSize
        });
    }

    try {
        const assets = await connection.getProgramAccounts(NIFTY_PROGRAM_ID, { filters });
        return assets;
    } catch (error) {
        console.error('Failed to fetch Nifty assets:', error);
        throw error;
    }

}

async function main() {
    const connection = new Connection(ENDPOINT, 'confirmed');
    const assets = await getNiftyAssets({
        connection,
        owner: OWNER_PUBKEY,
        group: GROUP_ADDRESS,
        dataSize: EPOCH_SIZE
    });
    const mints = assets.map(asset => (asset.pubkey.toBase58()));
    console.log(mints);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(-1);
    });