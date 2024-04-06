"use client"

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import React, { useMemo } from 'react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { endpoint } from '@/utils/constants';
import { EpochProgramProvider } from '@/hooks/useProgram';

require('@solana/wallet-adapter-react-ui/styles.css');

type SolanaProvidersProps = {
    children: React.ReactNode;
}
const SolanaProviders = ({ children }: SolanaProvidersProps) => {
    const walletEndpoint = useMemo(() => endpoint, []);

    return (
        <ConnectionProvider endpoint={walletEndpoint}>
            <WalletProvider wallets={[]} autoConnect>
                <WalletModalProvider>
                    <EpochProgramProvider>
                        {children}
                    </EpochProgramProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default SolanaProviders;