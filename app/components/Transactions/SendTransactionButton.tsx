"use client"
import React, { FC, useCallback, useState } from 'react';
import { Transaction, TransactionInstruction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import type { TransactionSignature } from '@solana/web3.js';
import { Toaster, toast } from 'sonner';
import { cluster } from '@/utils/constants';
import { shortenHash, getExplorerUrl } from '@/utils/utils';
import { useEpochProgram } from '@/hooks/useProgram';

type SendTransactionButtonProps = {
    transactionInstructions: TransactionInstruction[];
    buttonLabel: string;
    invisible?: boolean;
    width?: number;
    onSuccess?: () => void;
    disabled?: boolean;
};


export const SendTransactionButton: FC<SendTransactionButtonProps> = ({ transactionInstructions, buttonLabel, width, invisible = false, onSuccess, disabled = false }) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const { api } = useEpochProgram();
    const [isLoading, setIsLoading] = useState(false);

    const onClick = useCallback(async () => {
        try {
            if (!publicKey) throw new Error('Wallet not connected!');
            setIsLoading(true);

            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight },
            } = await connection.getLatestBlockhashAndContext();

            const transaction = new Transaction().add(...transactionInstructions);
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            let signature: TransactionSignature = await sendTransaction(transaction, connection, { minContextSlot });
            const url = getExplorerUrl(signature, cluster);
            const confirmation = await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, 'confirmed');
            if (!confirmation) throw new Error('Transaction failed');
            if (confirmation.value.err) throw new Error(`Transaction failed: ${confirmation.value.err}`);
            toast.success(<div><a href={url} target='_blank' rel='noreferrer'>Success! {shortenHash(signature)}</a></div>);
            if (onSuccess) { onSuccess() }


        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
            console.log(error)
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, connection, sendTransaction, transactionInstructions, onSuccess, api]);

    return (
        <div className={`${invisible ? 'w-full h-full' : ''} flex items-center justify-center w-full h-full`}>
            <Toaster richColors />
            <button
                onClick={onClick}
                disabled={!publicKey || isLoading || disabled}
                className={invisible
                    ? `w-full h-full bg-transparent border-none focus:outline-none z-10 text-opacity-0 hover:text-opacity-40 text-white`
                    : `p-[3px] relative min-w-60 ${isLoading ? 'opacity-75' : ''}`
                }
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
                <div className="px-8 py-2  bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <SpinnerIcon />
                        </div>
                    ) : (
                        buttonLabel
                    )}
                </div>
            </button>

        </div>
    );

};

const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0H4z"></path>
    </svg>
);

<button className="p-[3px] relative">
    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg" />
    <div className="px-8 py-2  bg-black rounded-[6px]  relative group transition duration-200 text-white hover:bg-transparent">
        Initialize Epoch Auction
    </div>
</button>