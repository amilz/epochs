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

function getWnsAccounts(mint: PublicKey): {
    manager: PublicKey,
    extraMetasAccount: PublicKey,
    groupAccount: PublicKey
    memberAccount: PublicKey
} {
    const [manager] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(WNS_SEEDS.MANAGER),
        ],
        WNS_PROGRAM_ID);
    const [extraMetasAccount] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(WNS_SEEDS.EXTRA_ACCOUNT_METAS),
            mint.toBuffer()
        ],
        WNS_PROGRAM_ID);

    const [groupAccount] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(WNS_SEEDS.GROUP),
            new PublicKey(mint).toBuffer()
        ],
        WNS_PROGRAM_ID);

    const [memberAccount] = PublicKey.findProgramAddressSync(
        [
            Buffer.from(WNS_SEEDS.MEMBER),
            new PublicKey(mint).toBuffer()
        ],
        WNS_PROGRAM_ID);

    return { manager, extraMetasAccount, groupAccount, memberAccount };
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


export {
    getAuctionPda,
    getEpochInscriptionPda,
    getReputationPda,
    getAuthorityPda,
    getAuctionEscrowPda,
    getWnsAccounts,
    getCollectionMintPda,
    getNftMintPda
};