import { Cluster } from "@solana/web3.js";

export const getExplorerUrl = (signature: string, cluster: Cluster) => {
    return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export const getEclipseUrl = (signature: string, cluster = 'testnet') => {
    return `https://explorer.dev.eclipsenetwork.xyz/tx/${signature}?cluster=${cluster}`
}

export const shortenHash = (str: string) => {
    return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

export const formatNumber = (number: number, numDecimals: number = 2) => {
    return number.toLocaleString(undefined, {
        minimumFractionDigits: numDecimals,
        maximumFractionDigits: numDecimals,
    });
}