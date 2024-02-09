import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { TOKEN_METADATA_PROGRAM_ID } from "./consts";
import {
    findInscriptionShardPda,
    findInscriptionMetadataPda,
    findMintInscriptionPda,
    MPL_INSCRIPTION_PROGRAM_ID,
  } from "@metaplex-foundation/mpl-inscription";


/**
 * Airdrops SOL to an array of public keys.
 * @param {PublicKey[]} pubkeys Array of PublicKey objects to receive the airdrop.
 * @param {Connection} connection Solana connection object.
 * @param {number} amount Amount of lamports to airdrop to each pubkey.
 * @returns {Promise<void>} A promise that resolves when all airdrops are confirmed.
 * 
 * Usage Example:
 * const wallet1 = Keypair.generate();
 * const wallet2 = Keypair.generate();
 * const wallet3 = Keypair.generate();
 * const wallets = [wallet1.publicKey, wallet2.publicKey, wallet3.publicKey];
 * await airdropToMultiple(wallets, connection, LAMPORTS_PER_SOL);
 */
async function airdropToMultiple(
    pubkeys: PublicKey[],
    connection: Connection,
    amount: number
): Promise<void> {
    try {
        const airdropPromises = pubkeys.map((pubkey) =>
            connection.requestAirdrop(pubkey, amount)
        );
        const airdropTxns = await Promise.all(airdropPromises);
        const confirmationPromises = airdropTxns.map((txn) =>
            connection.confirmTransaction(txn, "processed")
        );
        await Promise.all(confirmationPromises);
    } catch (error) {
        return Promise.reject(error);
    }
}

// Derive the PDA of the metadata account for the mint.
function getMetadataAddress(mint: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer()
        ],
        TOKEN_METADATA_PROGRAM_ID)
    return pda;
}


function getMasterEditionAddress(mint: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
            Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );
    return pda;
}

interface NftAccounts {
    mintKeypair: Keypair;
    metadataPda: PublicKey;
    masterEditionPda: PublicKey;
}

function createMintMetaAndMasterPdas():NftAccounts {
    const mintKeypair = Keypair.generate();
    const metadataPda = getMetadataAddress(mintKeypair.publicKey);
    const masterEditionPda = getMasterEditionAddress(mintKeypair.publicKey);
    return { mintKeypair, metadataPda, masterEditionPda };
}


function getInscriptionAccounts(mint: PublicKey) {
    const inscriptionProgram = new PublicKey('1NSCRfGeyo7wPUazGbaPBUsTM49e1k2aXewHGARfzSo')
    const [mintInscriptionAccount] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("Inscription"),
            inscriptionProgram.toBuffer(),
            mint.toBuffer(),
        ],
        inscriptionProgram
    );
    const [inscriptionMetadataAccount] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("Inscription"),
            inscriptionProgram.toBuffer(),
            mintInscriptionAccount.toBuffer(),
        ],
        inscriptionProgram
    );
    // rand # 0-32
    const shard = Math.floor(Math.random() * 32);


    // Example from Mainnet
    // Shard = 1
    // 76BsfqxZgmVg114yYtLFBopv6NAqvnxgcLvPKhxUMRHg
    let [inscriptionShardAccount] = PublicKey.findProgramAddressSync(
        [
            Buffer.from("Inscription"),
            Buffer.from("Shard"),
            inscriptionProgram.toBuffer(),
            Buffer.from(shard.toString())
        ],
        inscriptionProgram
    );
    inscriptionShardAccount = new PublicKey('76BsfqxZgmVg114yYtLFBopv6NAqvnxgcLvPKhxUMRHg');

    return {
        inscriptionProgram,
        mintInscriptionAccount,
        inscriptionMetadataAccount,
        inscriptionShardAccount
    }
}



export { 
    airdropToMultiple, 
    getMetadataAddress, 
    getMasterEditionAddress, 
    createMintMetaAndMasterPdas,
    getInscriptionAccounts
};