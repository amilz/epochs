import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

type AuctionState = { unClaimed: {} } | { claimed: {} };

export interface Auction {
    epoch: BN; 
    mint: PublicKey;
    state: AuctionState;
    highBidder: PublicKey;
    highBidLamports: BN;
    bump: number;
}