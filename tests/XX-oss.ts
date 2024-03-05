import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bmp } from "../target/types/bmp";
import { airdropToMultiple, initIdlToChain } from "./utils/utils";
import { assert } from "chai";
import { getAuctionEscrowPda, getAuctionPda, getAuthorityPda, getCollectionMintPda, getNftMintPda, getReputationPda } from "@epochs/api/utils";

import { ReputationTracker } from "./utils/reputation";
import { bidOnAuction } from "./utils/instructions/bid";
import { AUTHORITY } from "./utils/consts";
import { getMinterClaimPda, getMinterPda } from "./utils/pdas";


describe.only("Create a new OSS Collection, Mint, and Auction", () => {
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
    ]);

    const auctionResults = new Map<number, { highBidder: Keypair; bidAmount: number }>();
    const table = {};

    const TEST_EPOCH = 577; // using warp slot 18464 / 32 slots/epoch = 577 epochs


    before(async () => {
        await initIdlToChain();
        await airdropToMultiple([AUTHORITY.publicKey, payer.publicKey, bidder1.publicKey, bidder2.publicKey, bidder3.publicKey], provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
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

            table['group'] = groupAsset.toBase58();
            table['groupTx'] = sig;
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
            table['asset'] = asset.toBase58();
            table['assetTx'] = sig;
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
        auctionResults.set(TEST_EPOCH, { highBidder: lastBidder, bidAmount: lastBidAmount });

    });

    it("Auction winner claims rewards", async () => {
        await waitTilEpochIs(TEST_EPOCH + 1, program);

        const auctionPda = getAuctionPda(TEST_EPOCH, program);
        const { highBidder } = await program.account.auction.fetch(auctionPda);
        const auctionEscrow = getAuctionEscrowPda(program);
        const reputationPda = getReputationPda(highBidder, program);
        const asset = getNftMintPda(program, TEST_EPOCH);

        const signer = auctionResults.get(TEST_EPOCH)!.highBidder;

        const accounts = {
            winner: highBidder,
            auction: auctionPda,
            auctionEscrow,
            reputation: reputationPda,
            systemProgram: anchor.web3.SystemProgram.programId,
            daoTreasury: new PublicKey("zuVfy5iuJNZKf5Z3piw5Ho4EpMxkg19i82oixjk1axe"),
            creatorWallet: new PublicKey("zoMw7rFTJ24Y89ADmffcvyBqxew8F9AcMuz1gBd61Fa"),
            asset,
            authority: groupAuthority,
            ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
        };


        try {
            const ix = await program.methods.ossClaim(new anchor.BN(TEST_EPOCH))
                .accounts(accounts)
                .instruction();

            const tx = new anchor.web3.Transaction().add(ix);
            const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer);
            const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [signer]);
            table['claimTx'] = sig;
            assert.ok(sig, 'should have signature');
        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });

});

describe.only("Simulates retroactive mint", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Bmp as Program<Bmp>;

    it("Initiates the Minter", async () => {

        const accounts = {
            authority: AUTHORITY.publicKey,
            minter: getMinterPda(program),
            systemProgram: anchor.web3.SystemProgram.programId,
        };

        const now = new Date().getTime();
        // 5 seconds from now:
        const target = new Date(now + 5 * 1000).getTime();
        const tomorrow = new Date(now + 24 * 60 * 60 * 1000).getTime();

        try {
            const ix = await program.methods.ossInitMinter(new anchor.BN(500), new anchor.BN(target / 1000))
                .accounts(accounts)
                .instruction();

            const tx = new anchor.web3.Transaction().add(ix);
            const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(AUTHORITY);
            const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [AUTHORITY]);
            assert.ok(sig, 'should have signature');
        } catch (err) {
            console.log(err);
            assert.fail('error minting', err);
        }

    });

    it("Claim and reveal 500 mints from minter machine", async () => {
        const numberOfMints = 100;
        const numLoops = 5;
        for (let i = 0; i < numLoops; i++) {
            try {
                const minters = Array.from({ length: numberOfMints }, (_, i) => Keypair.generate());
                await airdropToMultiple(minters.map(m => m.publicKey), provider.connection, 100 * anchor.web3.LAMPORTS_PER_SOL);
                await new Promise(resolve => setTimeout(resolve, 10000));
                const claimPromises = minters.map(async (minter, i) => {
                    return performMinterClaim(minter, program, provider);
                });
                await Promise.all(claimPromises);
                const state = await program.account.minter.fetch(getMinterPda(program));
                assert.equal(state.itemsRedeemed.toNumber(), (numberOfMints * (i+1)), "1 Mint expected for each minter");
                const redeemPromises = minters.map(async (minter, i) => {
                    return performMinterRedeem(minter, program, provider);
                });
                await Promise.all(redeemPromises);
            } catch (err) {
                console.log(err);
                assert.fail('error minting', err);
            }
        }
        const state = await program.account.minter.fetch(getMinterPda(program));
        assert.equal(state.itemsRedeemed.toNumber(), (numberOfMints * numLoops), "1 Mint expected for each minter");
        assert.isFalse(state.active, "Minter should be inactive after all mints are redeemed");
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


async function waitTilEpochIs(
    targetEpoch: number,
    program: Program<Bmp>,
    checkInterval: number = 1000
) {
    let { epoch } = await program.provider.connection.getEpochInfo();
    if (targetEpoch < epoch) {
        throw new Error(`Target epoch ${targetEpoch} is already in the past`);
    }
    while (targetEpoch > epoch) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        ({ epoch } = await program.provider.connection.getEpochInfo());
    }
    return epoch;
}

async function performMinterClaim(payer: anchor.web3.Keypair, program: Program<Bmp>, provider: anchor.Provider) {
    const accounts = {
        payer: payer.publicKey,
        minter: getMinterPda(program),
        minterClaim: getMinterClaimPda(program, payer.publicKey),
        systemProgram: anchor.web3.SystemProgram.programId,
    };

    try {
        const ix = await program.methods.ossMinterClaim()
            .accounts(accounts)
            .instruction();

        const tx = new anchor.web3.Transaction().add(ix);
        const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.sign(payer);
        const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [payer]);
        assert.ok(sig, 'should have signature');
    } catch (err) {
        console.log(err);
        assert.fail('error minting', err);
    }
}


async function performMinterRedeem(payer: anchor.web3.Keypair, program: Program<Bmp>, provider: anchor.Provider) {
    const minterClaim = getMinterClaimPda(program, payer.publicKey);
    const claim = await program.account.minterClaim.fetch(minterClaim);

    const accounts = {
        asset: getNftMintPda(program, claim.epoch.toNumber()),
        payer: payer.publicKey,
        group: getCollectionMintPda(program),
        authority: getAuthorityPda(program),
        minterClaim: minterClaim,
        systemProgram: anchor.web3.SystemProgram.programId,
        ossProgram: new anchor.web3.PublicKey('AssetGtQBTSgm5s91d1RAQod5JmaZiJDxqsgtqrZud73'),
    };

    try {
        const ix1 = await program.methods.ossRedeemBlob()
            .accounts(accounts)
            .instruction();
        const ix2 = await program.methods.ossRedeemRest()
            .accounts(accounts)
            .instruction();

        const tx = new anchor.web3.Transaction().add(ix1).add(ix2);
        const { blockhash, lastValidBlockHeight } = (await provider.connection.getLatestBlockhash());
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.sign(payer);
        const sig = await anchor.web3.sendAndConfirmTransaction(provider.connection, tx, [payer]);
        assert.ok(sig, 'should have signature');
    } catch (err) {
        console.log(err);
        assert.fail('error minting', err);
    }
}

