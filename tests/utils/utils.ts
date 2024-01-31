import { Connection, PublicKey } from "@solana/web3.js";



/**
 * Airdrops SOL to an array of public keys.
 * @param {PublicKey[]} pubkeys Array of PublicKey objects to receive the airdrop.
 * @param {Connection} connection Solana connection object.
 * @param {number} amount Amount of lamports to airdrop to each pubkey.
 * @returns {Promise<void>} A promise that resolves when all airdrops are confirmed.
 * 
 * Usage Example:
 * const wallet1 = Keypair.generate();
 * const wallet2 = Keypair.generate();
 * const wallet3 = Keypair.generate();
 * const wallets = [wallet1.publicKey, wallet2.publicKey, wallet3.publicKey];
 * await airdropToMultiple(wallets, connection, LAMPORTS_PER_SOL);
 */
async function airdropToMultiple(
    pubkeys: PublicKey[],
    connection: Connection,
    amount: number
): Promise<void> {
    try {
        const airdropPromises = pubkeys.map((pubkey) =>
            connection.requestAirdrop(pubkey, amount)
        );
        const airdropTxns = await Promise.all(airdropPromises);
        const confirmationPromises = airdropTxns.map((txn) =>
            connection.confirmTransaction(txn, "processed")
        );
        await Promise.all(confirmationPromises);
    } catch (error) {
        return Promise.reject(error);
    }
}

export { airdropToMultiple };