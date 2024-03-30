"use client"
import { useEpoch } from '@/hooks/useProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { SendTransactionButton } from '../Transactions/SendTransactionButton';
import { AuctionTable } from '@/components/Auction/AuctionTable';
import { BidForm } from '@/components/Auction/BidForm';

const Auction = () => {
    const [transaction, setTransaction] = useState<Transaction>();
    const [png, setPng] = useState<string>();
    const { auction, epochInfo, epochClient, refreshAuction } = useEpoch();
    const { publicKey: payer } = useWallet();

    useEffect(() => {
        if (!epochClient) return;
        if (!payer) return;
        if (!auction) {
            epochClient.createInitEpochTransaction({ payer }).then((transaction) => {
                setTransaction(transaction);
                return;
            });
        }
    }, [epochClient, payer, setTransaction, auction, epochInfo]);

    useEffect(() => {
        if (!epochClient) return;
        if (!auction) return;
        if (!epochInfo) return;
        epochClient.fetchAssetAndImageByEpoch({ epoch: epochInfo.epoch }).then((asset) => {
            console.log(asset);
            setPng(asset.png);
        });
    }, [epochClient, auction, epochInfo, setPng]);



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