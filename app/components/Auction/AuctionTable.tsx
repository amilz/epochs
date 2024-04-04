import { formatNumber, shortenHash } from "@/utils/utils";
import { Auction } from "@epochs/api/utils/types";
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BidForm } from "./BidForm";

interface AuctionTableProps {
    auction: Auction;
}

export const AuctionTable = ({ auction }: AuctionTableProps) => {

    return (
        <div className=" mx-auto  rounded-xl shadow-md overflow-hidden  text-white border border-slate-700">
            <div className="p-5">
                <div className="flex flex-col space-y-4">
                    <div className="flex justify-between space-x-1">
                        <span className="text-sm font-medium ">High Bidder:</span>
                        <span className="text-sm font-medium ">High Bid:</span>
                    </div>
                    <div className="flex justify-between space-x-1">
                        <span className="text-sm font-semibold">{shortenHash(auction.highBidder.toBase58())}</span>
                        <span className="text-sm font-semibold">{formatNumber(auction.highBidLamports.toNumber() / LAMPORTS_PER_SOL)} SOL</span>
                    </div>
                </div>
                <BidForm />
            </div>
        </div>
    );
};
