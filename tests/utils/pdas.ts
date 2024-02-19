import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { SEEDS, TOKEN_METADATA_PROGRAM_ID } from "./consts";

function numberBuffer(value: bigint): Uint8Array {
    const bytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        bytes[i] = Number(value & BigInt(0xff));
        value = value >> BigInt(8);
    }
    return bytes;
}

function getAuctionPda(epoch: number, program: Program<any>) {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(SEEDS.AUCTION),
            numberBuffer(BigInt(epoch))
        ],
        program.programId
    );
    return pda;
}

function getEpochInscriptionPda(epoch: number, program: Program<any>) {
    const [pda] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(SEEDS.EPOCH_INSCRIPTION),
            numberBuffer(BigInt(epoch))
        ],
        program.programId
    );
    return pda;
}

function getReputationPda(user: PublicKey, program: Program<any>) {
    const [reputationMint] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(SEEDS.REPUTATION),
            user.toBuffer()
        ],
        program.programId
    );
    return reputationMint;
}

function getAuthorityPda(program: Program<any>) {
    const [authoirtyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.AUTHORITY)],
        program.programId
    );
    return authoirtyPda;
}

function getCollectionPda(program: Program<any>) {
    const [collectionMint] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.COLLECTION)],
        program.programId
    );
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

export { getAuctionPda, getEpochInscriptionPda, getReputationPda, getAuthorityPda };