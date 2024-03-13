import { Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction, SystemProgram } from "@solana/web3.js";
import { airdropToMultiple, initIdlToChain, waitTilEpochIs, waitUntilTimeStamp } from "./utils/utils";
import { assert } from "chai";
import { ReputationPoints, ReputationTracker } from "./utils/reputation";
import { AUTHORITY } from "./utils/consts";
import { EpochClient } from "@epochs/api";
import { performMinterClaim, performMinterRedeem } from "./utils/instructions/timeMachine";
import { Asset } from "@epochs/api/utils/deserialize/deserialize";
import { performRandomBid } from "./utils/instructions/bid";

describe("The Epochs Program", () => {
    const epochClient = EpochClient.local();

    const payer = Keypair.generate();

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
    let authorityPda = epochClient.fetchAuthorityPda();

    before(async () => {
        await initIdlToChain();
        await airdropToMultiple([AUTHORITY.publicKey, payer.publicKey, bidder1.publicKey, bidder2.publicKey, bidder3.publicKey], epochClient.connection, 100 * LAMPORTS_PER_SOL);
        await airdropToMultiple([authorityPda], epochClient.connection, 0.1 * LAMPORTS_PER_SOL);

    });


    describe("Group Initiation", () => {
        describe("Unauthorized signer cannot create Group Asset", async () => {
            it("should prevent unauthorized creation of a Group Asset", async () => {
                try {
                    const tx = await epochClient.createGroupTransaction({ payer: bidder1.publicKey });
                    const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
                    tx.recentBlockhash = blockhash;
                    tx.lastValidBlockHeight = lastValidBlockHeight;
                    tx.sign(bidder1);
                    const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [bidder1]);
                    assert.fail('Expected minting to fail');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });
        });


        describe("Group Asset Creation", () => {
            let sig;
            let group: Asset;

            before(async () => {
                // Arrange
                const tx = await epochClient.createGroupTransaction({ payer: AUTHORITY.publicKey });
                const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.lastValidBlockHeight = lastValidBlockHeight;
                tx.sign(AUTHORITY);

                // Act
                sig = await sendAndConfirmTransaction(epochClient.connection, tx, [AUTHORITY]);
                group = await epochClient.fetchDeserializedGroupAsset();
            });

            it("should have expected extensions", () => {
                const expectedExtensions = [
                    { number: 3, name: "Creators" },
                    { number: 4, name: "Links" },
                    { number: 5, name: "Metadata" },
                    { number: 6, name: "Grouping" },
                    { number: 7, name: "Royalties" }
                ];

                expectedExtensions.forEach((extension) =>
                    assert.isTrue(group.extensions.some((ext) => ext.type === extension.number),
                        `Group should include extension type ${extension.name}.`)
                );
            });

            it("should have correct metadata and state", () => {
                assert.strictEqual(group.state, 0, "Expected 'group.state' to be 0.");
                assert.strictEqual(group.standard, 0, "Expected 'group.standard' to be 0.");
                assert.strictEqual(group.mutable, false, "Expected 'group.mutable' to be false.");
                assert.strictEqual(group.holder, epochClient.fetchAuthorityPda().toBase58(), "Expected 'group.holder' to match the expected public key.");
                assert.strictEqual(group.group, SystemProgram.programId.toBase58(), "Expected 'group.group' to match the expected group public key.");
                assert.strictEqual(group.authority, epochClient.fetchAuthorityPda().toBase58(), "Expected 'group.authority' to match the expected authority public key.");
                assert.strictEqual(group.delegate, null, "Expected 'group.delegate' to be null.");
                assert.strictEqual(group.name, 'The Epochs Collection', "Expected 'group.name' to be 'The Epochs Collection'.");
                let grouping = group.extensions.find((ext) => ext.type === 6);
                assert.strictEqual(grouping.grouping.size, 0, "Expected group size to be 0.");
            });

            after(() => {
                assert.ok(sig, "Transaction should be signed and confirmed.");
            });
        });

        describe("Duplicate Group Asset Creation", () => {
            it("should prevent duplicate Group Assets", async () => {
                try {
                    const tx = await epochClient.createGroupTransaction({ payer: AUTHORITY.publicKey });
                    const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
                    tx.recentBlockhash = blockhash;
                    tx.lastValidBlockHeight = lastValidBlockHeight;
                    tx.sign(AUTHORITY);
                    const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [AUTHORITY]);
                    assert.fail('Expected minting to fail');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });
        });
    });
    describe("Epoch Auction Execution", () => {
        let testEpoch: number;
        let sig;
        let deserializedAsset: Asset;
        let initiatorReputation = 0;

        before(async () => {
            try {
                const reputation = await epochClient.fetchReputation({ user: payer.publicKey });
                if (reputation) {
                    initiatorReputation = reputation.reputation.toNumber();
                }
            } catch (error) {
                // Do nothing (expected for first time)
            }
            const { epoch: currentEpoch } = await epochClient.connection.getEpochInfo();
            testEpoch = await waitTilEpochIs(currentEpoch + 1, epochClient.connection);

            // Arrange
            const tx = await epochClient.createInitEpochTransaction({ payer: payer.publicKey });
            const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
            tx.recentBlockhash = blockhash;
            tx.lastValidBlockHeight = lastValidBlockHeight;
            tx.sign(payer);
            // Act
            sig = await sendAndConfirmTransaction(epochClient.connection, tx, [payer]);
            deserializedAsset = await epochClient.fetchDeserializedAssetByEpoch({ epoch: testEpoch });
            deserializedAsset.saveImg();
        });

        describe("Auction Initiation", () => {
            it("should initiate a new epoch and auction", async () => {
                try {
                    assert.ok(sig, 'should have signature');
                    assert.ok(deserializedAsset, 'should have deserialized asset');
                } catch (err) {
                    assert.fail('error initializing', err);
                }
            });
            it("should have correct auction state", async () => {
                try {
                    const auction = await epochClient.fetchAuction({ epoch: testEpoch });
                    assert.strictEqual(auction.epoch.toNumber(), testEpoch, "Expected epoch to match test epoch");
                    assert.strictEqual(auction.mint.toBase58(), epochClient.fetchAssetAddress({ epoch: testEpoch }).toBase58(), "Expected address to match mint PDA");
                    assert.strictEqual(auction.highBidLamports.toNumber(), 0, "Expected high bid to be 0");
                    assert.strictEqual(auction.highBidder.toBase58(), payer.publicKey.toBase58(), "Expected high bidder to be system program");
                    assert.deepStrictEqual(auction.state, { unClaimed: {} }, "Expected auction state to be unclaimed");
                } catch (err) {
                    assert.fail('error fetching auction state', err);
                }
            });
            it("should have correct asset metadata", async () => {
                try {
                    assert.strictEqual(deserializedAsset.state, 0, "Expected asset state to be 0");
                    assert.strictEqual(deserializedAsset.standard, 0, "Expected asset standard to be 0");
                    assert.strictEqual(deserializedAsset.mutable, false, "Expected asset mutable to be false");
                    assert.strictEqual(deserializedAsset.holder, epochClient.fetchAuthorityPda().toBase58(), "Expected asset holder to match authority PDA");
                    assert.strictEqual(deserializedAsset.group, epochClient.fetchGroupPda().toBase58(), "Expected asset group to match group PDA");
                    assert.strictEqual(deserializedAsset.authority, epochClient.fetchAuthorityPda().toBase58(), "Expected asset authority to match authority PDA");
                    assert.strictEqual(deserializedAsset.delegate, null, "Expected asset delegate to be null");
                    let expectedName = `Epoch #${testEpoch}`;
                    assert.strictEqual(deserializedAsset.name, expectedName, "Expected asset name to match epoch");
                } catch (err) {
                    assert.fail('error asserting asset metadata', err);
                }
            });
            it("should have correct reputation for the initiator", async () => {
                try {
                    const reputation = await epochClient.fetchReputation({ user: payer.publicKey });
                    assert.strictEqual(reputation.contributor.toBase58(), payer.publicKey.toBase58(), "Expected contributor to match payer");
                    assert.strictEqual(reputation.reputation.toNumber(), initiatorReputation + ReputationPoints.INITIATE, `Expected reputation to be increased by ${ReputationPoints.INITIATE} for initiations.`);
                } catch (err) {
                    assert.fail('error fetching reputation', err);
                }
            });
        });
        describe("Bidding Process", () => {
            it("should accurately reflect escrow balances, reputation, and high bids throughout a simulated bidding war", async () => {
                const numberOfBids = 10 + Math.floor(Math.random() * 5); // Random number of bids
                let lastBidAmount = LAMPORTS_PER_SOL; // Starting bid amount for the auction
                let lastBidder = payer; // Initiator is the first high bidder

                for (let i = 0; i < numberOfBids; i++) {
                    const bidResult = await performRandomBid({
                        client: epochClient,
                        epoch: testEpoch,
                        bidders: [bidder1, bidder2, bidder3],
                        reputationTrackers,
                        lastBidAmount: lastBidAmount,
                        lastBidder: lastBidder.publicKey,
                    });
                    lastBidAmount = bidResult.bidAmount;
                    lastBidder = bidResult.highBidder;
                }
                auctionResults.set(testEpoch, { highBidder: lastBidder, bidAmount: lastBidAmount });
            });
            it("should prevent a low bid", async () => {
                const lowBid = 0.1 * LAMPORTS_PER_SOL;
                try {
                    const tx = await epochClient.createBidTransaction({ bidder: bidder1.publicKey, bidAmount: lowBid });
                    const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
                    tx.recentBlockhash = blockhash;
                    tx.lastValidBlockHeight = lastValidBlockHeight;
                    tx.sign(bidder1);
                    const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [bidder1]);
                    assert.fail('Expected minting to fail');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });

        });
        describe("Auction Conclusion", () => {
            it("should prevent claim of reward before epoch is over", async function () {
                const { highBidder: winner } = await epochClient.fetchAuction({ epoch: testEpoch });
                const winnerKey = auctionResults.get(testEpoch).highBidder;
                // skip test if the epoch has already advanced
                let currentEpoch = (await epochClient.connection.getEpochInfo()).epoch;
                if (currentEpoch > testEpoch) {
                    this.skip();
                }

                try {
                    const tx = await epochClient.createClaimInstruction({ winner, epoch: testEpoch });
                    const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
                    tx.recentBlockhash = blockhash;
                    tx.lastValidBlockHeight = lastValidBlockHeight;
                    tx.sign(winnerKey);
                    const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [winnerKey]);
                    assert.fail('Expected minting to fail');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });

            it("should prevent unauthorized claim of the auction reward", async () => {
                await waitTilEpochIs(testEpoch + 1, epochClient.connection);
                // use a wallet that didn't participate in the bid war (payer)

                try {
                    const tx = await epochClient.createClaimInstruction({ winner: payer.publicKey, epoch: testEpoch });
                    const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
                    tx.recentBlockhash = blockhash;
                    tx.lastValidBlockHeight = lastValidBlockHeight;
                    tx.sign(payer);
                    const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [payer]);
                    assert.fail('Expected minting to fail');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });

            it("should allow the auction winner to claim the reward", async () => {
                await waitTilEpochIs(testEpoch + 1, epochClient.connection);

                const { highBidder: winner } = await epochClient.fetchAuction({ epoch: testEpoch });
                const winnerKey = auctionResults.get(testEpoch).highBidder;

                try {
                    const tx = await epochClient.createClaimInstruction({ winner, epoch: testEpoch });
                    const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
                    tx.recentBlockhash = blockhash;
                    tx.lastValidBlockHeight = lastValidBlockHeight;
                    tx.sign(winnerKey);
                    const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [winnerKey]);
                    assert.ok(sig, 'should have signature');
                } catch (err) {
                    console.log(err);
                    assert.fail('error minting', err);
                }
            });
        });
    });




    describe("Retroactive Time Machine Mint", () => {
        const timeToWaitInSeconds = 10;
        const startNumberItems = 250;
        const numberOfMints = 50;
        const numLoops = 5;

        let startTime: number;
        let currentTime: number;


        describe("Time Machine Initiation", () => {
            before(async () => {
                const slot = await epochClient.connection.getSlot();
                currentTime = await epochClient.connection.getBlockTime(slot);
                startTime = currentTime + timeToWaitInSeconds;
            });

            it("should prevent initiation with wrong authorization", async () => {
                const wrongAuthority = payer; // use an existing KP w/ lamports so it will not fail b/c 0 balance

                const tx = await epochClient.createTimeMachineInitInstruction({
                    itemsAvailable: startNumberItems,
                    startTime: startTime
                });

                const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.lastValidBlockHeight = lastValidBlockHeight;
                tx.sign(wrongAuthority);

                try {
                    await sendAndConfirmTransaction(epochClient.connection, tx, [wrongAuthority]);
                    assert.fail('Transaction should not succeed with wrong authority');
                } catch (err) {
                    assert.ok(err, "Expected transaction to fail with wrong authorization");
                }
            });

            it("should initiate the time machine with correct authorization", async () => {
                let sig;
                try {
                    const tx = await epochClient.createTimeMachineInitInstruction({
                        itemsAvailable: startNumberItems,
                        startTime: startTime
                    });
                    const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
                    tx.recentBlockhash = blockhash;
                    tx.lastValidBlockHeight = lastValidBlockHeight;
                    tx.sign(AUTHORITY);
                    sig = await sendAndConfirmTransaction(epochClient.connection, tx, [AUTHORITY]);

                    const state = await epochClient.fetchMinterDetails();
                    assert.ok(state, 'should have state');
                    assert.equal(state.itemsAvailable.toNumber(), startNumberItems, "Expected number of items to be available");
                    assert.equal(state.itemsRedeemed.toNumber(), 0, "Expected number of items redeemed to be 0");
                    assert.equal(state.startTime.toNumber(), startTime, "Expected start time to match input");
                    assert.ok(sig, 'should have signature');
                } catch (err) {
                    assert.fail(`Error initiating time machine with correct authorization: ${err.message}`);
                }
            });
            it("cannot initiate a second time", async () => {
                try {
                    const tx = await epochClient.createTimeMachineInitInstruction({
                        itemsAvailable: startNumberItems,
                        startTime: startTime
                    });
                    const { blockhash, lastValidBlockHeight } = await epochClient.connection.getLatestBlockhash();
                    tx.recentBlockhash = blockhash;
                    tx.lastValidBlockHeight = lastValidBlockHeight;
                    tx.sign(AUTHORITY);
                    await sendAndConfirmTransaction(epochClient.connection, tx, [AUTHORITY]);
                    assert.fail('Expected minting to fail');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });


        });

        describe("Claim Assets from Time Machine", () => {
            it("should fail to mint before the start time", async function () {
                const slot = await epochClient.connection.getSlot();
                const now = await epochClient.connection.getBlockTime(slot);
                if (now > startTime) {
                    this.skip();
                }
                const minter = Keypair.generate();
                try {
                    await airdropToMultiple([minter.publicKey], epochClient.connection, 100 * LAMPORTS_PER_SOL);
                    await performMinterClaim(minter, epochClient);
                    assert.fail('transaction should have failed');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });


            it("should be unable to claim with insufficient funds", async function () {
                await waitUntilTimeStamp(startTime + 1, 1000, epochClient);
                const minter = Keypair.generate();
                try {
                    await airdropToMultiple([minter.publicKey], epochClient.connection, 0.1 * LAMPORTS_PER_SOL);
                    await performMinterClaim(minter, epochClient);
                    assert.fail('transaction should have failed');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });

            it("should claim and reveal 250 mints from Time Machine", async () => {
                await waitUntilTimeStamp(startTime + 1, 1000, epochClient);
                for (let i = 0; i < numLoops; i++) {
                    try {
                        const minters = Array.from({ length: numberOfMints }, (_, i) => Keypair.generate());
                        await airdropToMultiple(minters.map(m => m.publicKey), epochClient.connection, 100 * LAMPORTS_PER_SOL);
                        const claimPromises = minters.map(async (minter, i) => {
                            return performMinterClaim(minter, epochClient);
                        });
                        await Promise.all(claimPromises);
                        const state = await epochClient.fetchMinterDetails();
                        assert.equal(state.itemsRedeemed.toNumber(), (numberOfMints * (i + 1)), "1 Mint expected for each minter");
                        const redeemPromises = minters.map(async (minter, i) => {
                            return performMinterRedeem(minter, epochClient);
                        });
                        await Promise.all(redeemPromises);
                        assert.ok(true, 'should have redeemed');
                    } catch (err) {
                        assert.fail('error minting', err);
                    }
                }
            });

            it("should be empty and disabled after all mints are claimed", async () => {
                try {
                    const state = await epochClient.fetchMinterDetails();
                    assert.isFalse(state.active, "Minter should be inactive after all mints are redeemed");
                    assert.equal(state.itemsRedeemed.toNumber(), numberOfMints * numLoops, "No more items should be available");
                } catch (err) {
                    assert.fail('error fetching state', err);
                }
            });

            it("should not be able to mint after closed", async function () {
                const minter = Keypair.generate();
                try {
                    await airdropToMultiple([minter.publicKey], epochClient.connection, 0.1 * LAMPORTS_PER_SOL);
                    await performMinterClaim(minter, epochClient);
                    assert.fail('transaction should have failed');
                } catch (err) {
                    assert.ok(err, "Expected minting to fail");
                }
            });
            it("should have correct metadata for each asset", async () => {
                const assets = Array.from({ length: numberOfMints * numLoops }, (_, i) => i + 1);
                const promises = assets.map(async (i) => {
                    try {
                        const asset = await epochClient.fetchDeserializedAssetByEpoch({ epoch: i });
                        assert.strictEqual(asset.name, `Epoch #${i}`, `Expected asset name to be "Epoch #${i}"`);
                        assert.strictEqual(asset.state, 0, "Expected asset state to be 0");
                        assert.strictEqual(asset.standard, 0, "Expected asset standard to be 0");
                        assert.strictEqual(asset.mutable, false, "Expected asset mutable to be false");
                        assert.strictEqual(asset.group, epochClient.fetchGroupPda().toBase58(), "Expected asset group to match group PDA");
                        assert.strictEqual(asset.authority, epochClient.fetchAuthorityPda().toBase58(), "Expected asset authority to match authority PDA");
                        assert.strictEqual(asset.delegate, null, "Expected asset delegate to be null");

                        const expectedExtensions = [
                            { number: 1, name: "Attributes" },
                            { number: 2, name: "Blob" },
                        ];
                        expectedExtensions.forEach((extension) =>
                            assert.isTrue(asset.extensions.some((ext) => ext.type === extension.number),
                                `Group should include extension type ${extension.name}.`)
                        );

                    } catch (err) {
                        assert.fail(`Error fetching or asserting Asset ${i}: ${err.message}`);
                    }
                });
                await Promise.all(promises);
            });
        });
    });
});
