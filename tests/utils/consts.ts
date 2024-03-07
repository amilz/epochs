import { Keypair } from "@solana/web3.js";
import secret from "../wallet/AUTH.json";

export const AUTHORITY = Keypair.fromSecretKey(new Uint8Array(secret));

export const SEEDS = {
    AUCTION: "Auction",
    AUCTION_ESCROW: "AuctionEscrow",
    AUTHORITY: "Authority",
    COLLECTION: "Collection",
    EPOCH_INSCRIPTION: "EpochInscription",
    MINTER: "Minter",
    NFT_MINT: "NftMint",
    REPUTATION: "Reputation"
}