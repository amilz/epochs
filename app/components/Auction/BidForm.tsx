"use client"
import { useState, useEffect } from "react";
import { useEpochProgram } from "@/hooks/useProgram";
import { SendTransactionButton } from "../Transactions/SendTransactionButton";
import { Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from "@solana/wallet-adapter-react";
import { useEpoch } from "@/hooks/useEpoch";

export const BidForm = () => {
    const [bidAmount, setBidAmount] = useState<string>(''); // State to track bid amount
    const [transaction, setTransaction] = useState<Transaction>();
    const { api } = useEpochProgram();
    const { refreshAuction } = useEpoch({});
    const { publicKey: bidder } = useWallet();

    useEffect(() => {
        if (!api || !bidder || bidAmount === '') {
            setTransaction(undefined);
            return;
        }

        const bidAmountFloat = parseFloat(bidAmount);
        if (isNaN(bidAmountFloat)) {
            setTransaction(undefined);
            return;
        }

        const lamports = Math.floor(bidAmountFloat * LAMPORTS_PER_SOL);

        api.createBidTransaction({ bidAmount: lamports, bidder }).then((transaction) => {
            setTransaction(transaction);
        });

    }, [api, bidder, bidAmount]);

    const handleBidAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setBidAmount(event.target.value);
    };

    if (!bidder) { return <></> }
    const placeholder = new TransactionInstruction({ keys: [], programId: bidder });
    const disabled = !transaction || !bidder || bidAmount === '';
    return (
        <>
            <form className="flex flex-col space-y-4 mb-4">
                <div className="mt-4">
                    <label htmlFor="bid" className="block text-sm font-medium text-gray-300">Minimum bid is 2.2 SOL. Happy bidding! Use</label>
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

            <SendTransactionButton
                transactionInstructions={transaction?.instructions ?? [placeholder]}
                buttonLabel={disabled ? `Enter bid` : `Bid ${bidAmount} SOL`}
                /* TODO make sure auction is complete before refresh */
                onSuccess={refreshAuction}
                disabled={disabled}
            />
            <div className="mt-2 block text-xs font-medium text-gray-300">Bids must be at least 10% higher. Bid ends immediately after Epoch.
            </div>

        </>
    );
};


