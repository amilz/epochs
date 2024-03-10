import { sendAndConfirmTransaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { EpochClient } from "@epochs/api";

async function performMinterClaim(payer: anchor.web3.Keypair, epochClient: EpochClient) {
    try {
        const tx = await epochClient.createTimeMachineAttemptInstruction({ payer: payer.publicKey });
        const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.sign(payer);
        const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [payer]);
        assert.ok(sig, 'should have signature');
    } catch (err) {
        assert.fail('error minting', err);
    }
}


async function performMinterRedeem(payer: anchor.web3.Keypair, epochClient: EpochClient) {

    try {
        const tx = await epochClient.createRedeemFromTimeMachineInstruction({ payer: payer.publicKey });
        const { blockhash, lastValidBlockHeight } = (await epochClient.connection.getLatestBlockhash());
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.sign(payer);
        const sig = await sendAndConfirmTransaction(epochClient.connection, tx, [payer]);
        assert.ok(sig, 'should have signature');
    } catch (err) {
        console.log(err);
        assert.fail('error minting', err);
    }
}

export { performMinterClaim, performMinterRedeem };

