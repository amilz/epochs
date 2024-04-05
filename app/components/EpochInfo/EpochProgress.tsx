import React from 'react';
import { useEpochProgram } from '@/hooks/useProgram';

export const EpochProgress: React.FC = () => {
    const { epochInfo } = useEpochProgram();

    if (!epochInfo) return null;

    const progress = ((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(0);

    return (
        <>
            <div className="w-full flex items-center">
                <p className="text-base text-gray-300 mr-2">progress to next epoch: {progress}%</p>
                <div className="flex-1 h-2 bg-zinc-900 mr-4">
                    <div className="h-2 bg-white" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <p className="text-sm text-gray-300">solana mainnet beta v1.18</p>
        </>
    );
};