import { formatNumber, shortenHash } from "@/utils/utils";
import { Auction } from "@epochs/api/utils/types";
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BidForm } from "./BidForm";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { EpochStatus } from "@/utils/types";


interface AuctionTableProps {
    auction: Auction;
    epochStatus: EpochStatus;
}

export const AuctionTable = ({ auction, epochStatus }: AuctionTableProps) => {
    const { connected } = useWallet();
    const { setVisible } = useWalletModal();

    const showBidForm = epochStatus === 'ACTIVE';
    const highBidderText = (epochStatus === 'UNCLAIMED' || epochStatus === 'COMPLETE') ? 'Winner' : 'High Bidder';

    return (
        <div className=" mx-auto  rounded-xl shadow-md overflow-hidden  text-white border border-slate-700 lg:w-2/3 lg:min-h-[320px]">
            <div className="p-5">
                <div className="flex flex-col space-y-4 ">
                    <div className="flex  space-x-1 text-md font-medium">
                        <span className="w-1/2	">High Bid:</span>
                        <span className="w-1/2	">{highBidderText}:</span>
                    </div>
                    <div className="flex  space-x-1 text-xl font-semibold">
                        <span className="w-1/2	">Ξ {formatNumber(auction.highBidLamports.toNumber() / LAMPORTS_PER_SOL)}</span>
                        <span className="text-xl w-1/2	">{shortenHash(auction.highBidder.toBase58())}</span>
                    </div>
                </div>
                <div className={`flex items-center justify-center w-full h-full`}>

                    {!connected && showBidForm &&
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
                {showBidForm && <BidForm highBidLamports={auction.highBidLamports.toNumber()} />}
            </div>
        </div>
    );
};
