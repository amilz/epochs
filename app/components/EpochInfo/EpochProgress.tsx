"use client"
import React, { useState, useEffect } from 'react';
import { useEpochProgram } from '@/hooks/useProgram';

interface Props {
    epoch?: number;
}

export const EpochProgress: React.FC<Props> = ({ epoch }: Props) => {
    const { epochInfo } = useEpochProgram();
    const [progress, setProgress] = useState<string>('0');
    const [displayText, setDisplayText] = useState<string>('fetching epoch');

    useEffect(() => {
        if (!epochInfo) return;
        if (!epoch) return;

        const isCurrentEpoch = epoch && epochInfo && (epoch === epochInfo?.epoch);
        const pgx = !epochInfo ? '0' : isCurrentEpoch ? ((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(0) : '100';
        const displayText = !epochInfo ? 'fetching epoch' : isCurrentEpoch ? `progress to next epoch: ${pgx}%` : 'epoch complete';

        setProgress(pgx);
        setDisplayText(displayText);
    }, [epoch, epochInfo]);

    const displayNetwork = 'eclipse testnet';

    return (
        <>
            <div className="w-full min-w-80	flex items-center">
                <p className="text-base text-gray-300 mr-2">{displayText}</p>
                <div className="flex-1 h-2 bg-zinc-700 ">
                    <div className="h-2 bg-white transition-width duration-700 ease-in" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <p className="text-sm text-gray-300">{displayNetwork}</p>
        </>
    );
};
