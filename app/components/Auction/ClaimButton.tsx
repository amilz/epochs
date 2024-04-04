"use client"
import { useEpochProgram } from '@/hooks/useProgram';
import { useEpoch } from '@/hooks/useEpoch';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { SendTransactionButton } from '../Transactions/SendTransactionButton';

interface Props {
    epochNumber: number;
}

const ClaimButton = ({ epochNumber }: Props) => {
    const [transaction, setTransaction] = useState<Transaction>();
    const { epochInfo, api } = useEpochProgram();
    const { auction, refreshAuction, epochStatus } = useEpoch({ epochNumber });
    const { publicKey: winner, connected } = useWallet();

    useEffect(() => {
        if (!api) return;
        if (!winner) return;
        if (!auction) return;
        api.createClaimInstruction({ winner, epoch: epochNumber }).then((transaction) => {
            setTransaction(transaction);
            return;
        });

    }, [api, winner, setTransaction, auction, epochInfo, epochNumber]);

    const canClaim = epochStatus === "UNCLAIMED" && winner?.toBase58() === auction?.highBidder.toBase58();
    const showButton = auction && transaction && connected && canClaim;
    return (
        <div className="flex-col min-w-[332px] sm:min-w-[632px] mt-10 items-center justify-between ">
            {showButton &&
                <SendTransactionButton
                    transactionInstructions={transaction.instructions}
                    buttonLabel="You Won 🎉 - Claim Epoch"
                    onSuccess={refreshAuction}
                />
            }
        </div>
    )
}
export default ClaimButton;

