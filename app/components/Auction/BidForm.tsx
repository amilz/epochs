"use client"
import { useState, useEffect } from "react";
import { useEpoch } from "@/hooks/useProgram";
import { SendTransactionButton } from "../Transactions/SendTransactionButton";
import { Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from "@solana/wallet-adapter-react";

export const BidForm = () => {
    const [bidAmount, setBidAmount] = useState<string>(''); // State to track bid amount
    const [transaction, setTransaction] = useState<Transaction>();
    const { epochClient, refreshAuction } = useEpoch();
    const { publicKey: bidder } = useWallet();

    useEffect(() => {
        if (!epochClient || !bidder || bidAmount === '') {
            setTransaction(undefined);
            return;
        }

        const bidAmountFloat = parseFloat(bidAmount);
        if (isNaN(bidAmountFloat)) {
            setTransaction(undefined);
            return;
        }

        const lamports = Math.floor(bidAmountFloat * LAMPORTS_PER_SOL);

        epochClient.createBidTransaction({ bidAmount: lamports, bidder }).then((transaction) => {
            setTransaction(transaction);
        });

    }, [epochClient, bidder, bidAmount]);

    const handleBidAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setBidAmount(event.target.value);
    };

    if (!bidder) { return <></> }

    return (
        <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
            <form className="flex flex-col space-y-4">
                <div>
                    <label htmlFor="bid" className="block text-sm font-medium text-gray-700">Bid Amount</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                            type="number"
                            id="bid"
                            value={bidAmount}
                            onChange={handleBidAmountChange}
                            className="block w-full pr-12 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-4 text-black"
                            placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                            <label className="pr-3 text-sm font-medium text-gray-500">SOL</label>
                        </div>
                    </div>
                </div>
            </form>
            {transaction && (
                <SendTransactionButton
                    transactionInstructions={transaction.instructions}
                    buttonLabel={`Bid ${bidAmount} SOL`}
                    onSuccess={refreshAuction}
                />
            )}
        </div>
    );
};
