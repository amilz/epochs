import { Connection, PublicKey } from "@solana/web3.js";
import { exec } from "child_process";


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



function openFile(filePath: string) {
    exec(`open ${filePath}`, (error) => {
        if (error) {
            console.error(`Error opening file ${filePath}:`, error);
        }
    });
}




// Function to execute a shell command
function runShellCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`stderr: ${stderr}`);
                return;
            }
            resolve(stdout);
        });
    });
}

// Using the function in a test or any async context

async function initIdlToChain() {
    try {
        const output = await runShellCommand('anchor run init_idl');
        // console.log(`  `, output);
    } catch (error) {
        console.error('Command failed:', error);
    }
};



function printTableData(accounts: Record<string, PublicKey>) {
    const tableData = Object.entries(accounts).map(([key, publicKey]) => ({
        account: key,
        mint: publicKey.toBase58()
    }));
    console.table(tableData);
}





export {
    airdropToMultiple,
    openFile,
    initIdlToChain,
    printTableData
};