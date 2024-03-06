import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { SEEDS, WNS_PROGRAM_ID, WNS_SEEDS } from "../constants";

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

function getAuctionEscrowPda(program: Program<any>) {
    const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.AUCTION_ESCROW)],
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

function getCollectionMintPda(program: Program<any>) {
    const [collectionMint] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.COLLECTION)],
        program.programId
    );
    return collectionMint;
}

function getNftMintPda(program: Program<any>, epoch: number) {
    const [nftMint] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(SEEDS.NFT_MINT),
            numberBuffer(BigInt(epoch))
        ],
        program.programId
    );
    return nftMint;
}

function getMinterPda(program: Program<any>) {
    const [minter] = PublicKey.findProgramAddressSync(
        [Buffer.from(SEEDS.MINTER)],
        program.programId
    );
    return minter;
}


function getMinterClaimPda(program: Program<any>, payer: PublicKey) {
    const [minterClaim] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(SEEDS.MINTER_CLAIM),
            payer.toBuffer()
        ],
        program.programId
    );
    return minterClaim;
}


export {
    getAuctionPda,
    getReputationPda,
    getAuthorityPda,
    getAuctionEscrowPda,
    getCollectionMintPda,
    getNftMintPda,
    getMinterPda,
    getMinterClaimPda
};