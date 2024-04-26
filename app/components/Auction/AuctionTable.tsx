import { formatNumber, shortenHash } from "@/utils/utils";
import { Auction } from "@epochs/api/utils/types";
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BidForm } from "./BidForm";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";


interface AuctionTableProps {
    auction: Auction;
}

export const AuctionTable = ({ auction }: AuctionTableProps) => {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

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
                        <span className="text-sm font-semibold">{formatNumber(auction.highBidLamports.toNumber() / LAMPORTS_PER_SOL)} ETH</span>
                    </div>
                </div>
                <div className={`flex items-center justify-center w-full h-full`}>

                {!connected &&
                    <button
                        onClick={() => setVisible(true)}
                        disabled={connected}
                        className={"p-[3px] relative min-w-60 mt-8"}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
                        <div className="px-8 py-2  bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
                            Connect Wallet to Bid
                        </div>
                    </button>}
                </div>
                <BidForm highBidLamports={auction.highBidLamports.toNumber()} />
            </div>
        </div>
    );
};
