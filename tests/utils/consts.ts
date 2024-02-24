import { PublicKey } from "@solana/web3.js";

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const WNS_PROGRAM_ID = new PublicKey("wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM");

export const SEEDS = {
    AUCTION: "Auction",
    AUCTION_ESCROW: "AuctionEscrow",
    AUTHORITY: "Authority",
    COLLECTION: "Collection",
    EPOCH_INSCRIPTION: "EpochInscription",
    NFT_MINT: "NftMint",
    REPUTATION: "Reputation"
}