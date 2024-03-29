import { formatNumber, shortenHash } from "@/utils/utils";
import { Auction } from "@epochs/api/utils/types";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface AuctionTableProps {
    auction: Auction;
}

export const AuctionTable = ({ auction }: AuctionTableProps) => {
    return (
        <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl text-black">
            <div className="p-5">
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-between space-x-20">
                        <span className="text-sm font-medium ">Mint:</span>
                        <span className="text-sm font-semibold">{shortenHash(auction.mint.toBase58())}</span>
                    </div>
                    <div className="flex justify-between space-x-2">
                        <span className="text-sm font-medium ">High Bidder:</span>
                        <span className="text-sm font-semibold">{shortenHash(auction.highBidder.toBase58())}</span>
                    </div>
                    <div className="flex justify-between space-x-2">
                        <span className="text-sm font-medium ">High Bid:</span>
                        <span className="text-sm font-semibold">{formatNumber(auction.highBidLamports.toNumber() / LAMPORTS_PER_SOL)} SOL</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
