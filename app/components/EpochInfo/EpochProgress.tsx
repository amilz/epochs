import React from 'react';
import { useEpochProgram } from '@/hooks/useProgram';

interface Props {
    epoch?: number;
}

export const EpochProgress: React.FC<Props> = ({ epoch }: Props) => {
    const { epochInfo } = useEpochProgram();

    // Leveraging here instead of the hook b/c there's a instant where we incorrectly flash "epoch complete" before while loading
    const isCurrentEpoch = epoch && epochInfo && (epoch === epochInfo?.epoch);

    const progress = !epochInfo ? '0' : isCurrentEpoch ? ((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(0) : '100';
    const displayText = !epochInfo ? 'fetching epoch' : isCurrentEpoch ? `progress to next epoch: ${progress}%` : 'epoch complete';
    const displayNetwork = 'eclipse testnet';

    return (
        <>
            <div className="w-full min-w-80	flex items-center">
                <p className="text-base text-gray-300 mr-2">{displayText}</p>
                <div className="flex-1 h-2 bg-zinc-700 ">
                    <div className="h-2 bg-white" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <p className="text-sm text-gray-300">{displayNetwork}</p>
        </>
    );
};
