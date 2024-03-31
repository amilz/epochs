"use client"
import { useEpochProgram } from '@/hooks/useProgram';
import { useEpoch } from '@/hooks/useEpoch';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { SendTransactionButton } from '../Transactions/SendTransactionButton';
import { AuctionTable } from '@/components/Auction/AuctionTable';
import { BidForm } from '@/components/Auction/BidForm';


interface Props {
    epochNumber?: number;
}

const Auction = ({ epochNumber }: Props) => {
    const [transaction, setTransaction] = useState<Transaction>();
    const [png, setPng] = useState<string>();
    const { epochInfo, api } = useEpochProgram();
    const { auction, refreshAuction } = useEpoch({ epochNumber });
    const { publicKey: payer } = useWallet();

    useEffect(() => {
        if (!api) return;
        if (!payer) return;
        if (!auction) {
            api.createInitEpochTransaction({ payer }).then((transaction) => {
                setTransaction(transaction);
                return;
            });
        }
    }, [api, payer, setTransaction, auction, epochInfo]);

    useEffect(() => {
        if (!api) return;
        if (!auction) return;
        if (!epochInfo) return;
        api.fetchAssetAndImageByEpoch({ epoch: epochInfo.epoch }).then((asset) => {
            setPng(asset.png);
        });
    }, [api, auction, epochInfo, setPng]);

    return (
        <div className="flex flex-col items-center justify-between p-24">
            {epochInfo && <div>Current Epoch: {epochInfo?.epoch}</div>}
            <div>Auction {auction ? "is" : "is not"} live.</div>
            {!auction && transaction &&
                <SendTransactionButton
                    transactionInstructions={transaction.instructions}
                    buttonLabel="Create Auction"
                    onSuccess={refreshAuction}
                />
            }
            {auction && (
                <>
                    <AuctionTable auction={auction} />
                    <BidForm />
                    {png && <img src={png} alt="NFT" />}
                </>
            )}
        </div>
    )
}
export default Auction;