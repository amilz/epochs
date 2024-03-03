import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple, initIdlToChain } from "./utils/utils";
import { assert } from "chai";
import { getAuctionPda, getAuthorityPda, getCollectionMintPda, getNftMintPda, getReputationPda } from "@epochs/api/utils";

import { ReputationTracker } from "./utils/reputation";
import { bidOnAuction } from "./utils/instructions/bid";


describe.only("Create a new OSS Mint", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const payer = Keypair.generate();
    const program = anchor.workspace.Bmp as Program<Bmp>;

    const groupAsset = getCollectionMintPda(program);
    const groupAuthority = getAuthorityPda(program);
    const bidder1 = Keypair.generate();
    const bidder2 = Keypair.generate();
    const bidder3 = Keypair.generate();

    const bidder1ReputationTracker = new ReputationTracker(bidder1.publicKey);
    const bidder2ReputationTracker = new ReputationTracker(bidder2.publicKey);
    const bidder3ReputationTracker = new ReputationTracker(bidder3.publicKey);

    const reputationTrackers = new Map([
        [bidder1.publicKey.toBase58(), bidder1ReputationTracker],
        [bidder2.publicKey.toBase58(), bidder2ReputationTracker],
        [bidder3.publicKey.toBase58(), bidder3ReputationTracker],
    ])

    const TEST_EPOCH = 0;


    before(async () => {
        await initIdlToChain();
        await airdropToMultiple([payer.publicKey, bidder1.publicKey, bidder2.publicKey, bidder3.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
    });

    it("Creats a group OSS NFT", async () => {

        const accounts = {
            payer: payer.publicKey,
            asset: groupAsset,
            authority: groupAuthority,
            systemProgram: anchor.web3.SystemProgram.programId,
            ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
        };


        try {
            const ix = await program.methods.ossCreateGroup()
                .accounts(accounts)
                .instruction();

            const tx = new anchor.web3.Transaction().add(ix);
            const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer);
            const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [payer]);

            console.log('asset', groupAsset.toBase58());
            console.log('txid', sig);
            assert.ok(sig, 'should have signature');
        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }
    });

    it("Creates an OSS NFT and initiates auction", async () => {
        const asset = getNftMintPda(program, TEST_EPOCH);
        const auctionPda = getAuctionPda(TEST_EPOCH, program);
        const reputationPda = getReputationPda(payer.publicKey, program);

        const accounts = {
            payer: payer.publicKey,
            asset,
            group: groupAsset,
            authority: groupAuthority,
            systemProgram: anchor.web3.SystemProgram.programId,
            ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
        };

        const auctionAccounts = {
            payer: payer.publicKey,
            auction: auctionPda,
            reputation: reputationPda,
            asset,
            systemProgram: anchor.web3.SystemProgram.programId,
        };


        //printTableData(accounts);

        try {
            const ixBlob = await program.methods.ossCreateBlob(new anchor.BN(TEST_EPOCH))
                .accounts(accounts)
                .instruction();

            const ixRestrict = await program.methods.ossCreateRest(new anchor.BN(TEST_EPOCH))
                .accounts(accounts)
                .instruction();

            const ixAuction = await program.methods.ossInitAuction(new anchor.BN(TEST_EPOCH))
                .accounts(auctionAccounts)
                .instruction();

            const tx = new anchor.web3.Transaction().add(ixBlob).add(ixRestrict).add(ixAuction);
            const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer);
            const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [payer]);
            console.log('asset', asset.toBase58());
            console.log('sig', sig);
            assert.ok(sig, 'should have signature');

        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });

    it("Simulates bidding war an auction", async () => {
        const numberOfBids = 10 + Math.floor(Math.random() * 5); // Random number of bids
        let lastBidAmount = LAMPORTS_PER_SOL; // Starting bid amount for the auction
        let lastBidder = payer; // Initiator is the first high bidder

        for (let i = 0; i < numberOfBids; i++) {
            const bidResult = await performRandomBid({
                program,
                epoch: TEST_EPOCH,
                bidders: [bidder1, bidder2, bidder3],
                reputationTrackers,
                lastBidAmount: lastBidAmount,
                lastBidder: lastBidder.publicKey,
            });
            lastBidAmount = bidResult.bidAmount;
            lastBidder = bidResult.highBidder;
        }
    });

});


function printTableData(accounts: Record<string, anchor.web3.PublicKey>) {
    const tableData = Object.entries(accounts).map(([key, publicKey]) => ({
        account: key,
        mint: publicKey.toBase58()
    }));
    console.table(tableData);
}


async function performRandomBid({
    program,
    epoch,
    bidders,
    reputationTrackers,
    lastBidAmount,
    lastBidder, // Add the last bidder as a parameter
}: {
    program: Program<Bmp>,
    epoch: number,
    bidders: Keypair[],
    reputationTrackers: Map<string, ReputationTracker>,
    lastBidAmount: number,
    lastBidder: PublicKey, // Use PublicKey type for the last bidder
}) {
    const randomBidderIndex = Math.floor(Math.random() * bidders.length);
    const bidder = bidders[randomBidderIndex];
    // Ensure the next bid is at least 1.5 SOL greater than the last bid
    const bidIncrement = Math.floor((1.5 + Math.random()) * LAMPORTS_PER_SOL); // Random increment, minimum 1.5 SOL
    const bidAmount = lastBidAmount + bidIncrement;

    const reputationTracker = reputationTrackers.get(bidder.publicKey.toBase58())!;

    await bidOnAuction({
        bidAmount,
        epoch,
        program,
        bidder,
        highBidder: lastBidder, // Use the last bidder as the highBidder for this bid
        expectedReputation: reputationTracker,
    });

    return { bidAmount, highBidder: bidder }; // Return the current bid amount and bidder public key for the next bid
}

