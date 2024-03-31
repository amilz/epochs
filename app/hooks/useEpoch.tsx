import { useState, useEffect, useCallback } from 'react';
import { Auction } from '@epochs/api/utils/types';
import { useEpochProgram } from './useProgram';
import { DeserializedAsset, EpochStatus } from '@/utils/types';

interface Props {
    epochNumber?: number;
}

export const useEpoch = ({ epochNumber }: Props) => {
    const [auction, setAuction] = useState<Auction | null>(null);
    const [asset, setAsset] = useState<DeserializedAsset | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCurrentEpoch, setIsCurrentEpoch] = useState(false);
    const [epochStatus, setEpochStatus] = useState<EpochStatus>(EpochStatus.DOES_NOT_EXIST);

    const { api, epochInfo, isLoading: isEpochProgramLoading } = useEpochProgram();

    const searchEpoch = epochNumber ?? epochInfo?.epoch;

    const refreshAuction = useCallback(() => {
        if (!searchEpoch || !api) return;
        setIsLoading(true);
        api.fetchAuction({ epoch: searchEpoch })
            .then(setAuction)
            .catch(() => setAuction(null))
            .finally(() => setIsLoading(false));
    }, [api, searchEpoch]);

    useEffect(() => {
        refreshAuction();
    }, [refreshAuction]);

    useEffect(() => {
        if (!api || !searchEpoch) return;
        setIsLoading(true);
        api.fetchAssetAndImageByEpoch({ epoch: searchEpoch })
            .then(setAsset)
            .catch(() => setAsset(null))
            .finally(() => setIsLoading(false));
    }, [api, searchEpoch]);

    useEffect(() => {
        if (!searchEpoch || !epochInfo || !api) return;

        const calculateStatus = (): EpochStatus => {
            const isCurrentEpoch = searchEpoch === epochInfo.epoch;
            setIsCurrentEpoch(isCurrentEpoch);
            const epochPassed = searchEpoch < epochInfo.epoch;            
            if (!asset && !isCurrentEpoch) {
                return EpochStatus.DOES_NOT_EXIST;
            }
            else if (!asset && isCurrentEpoch) {
                return EpochStatus.NOT_YET_STARTED;
            } else if (asset && isCurrentEpoch) {
                return EpochStatus.ACTIVE;
            } else if (asset && epochPassed && !auction) {
                return EpochStatus.COMPLETE; // This is for Time Machine mints that have no auction
            } else if (asset && epochPassed && auction && !api.isClaimed(auction)) {
                return EpochStatus.UNCLAIMED;
            } else if (asset && epochPassed && auction && api.isClaimed(auction)) {
                return EpochStatus.COMPLETE;
            } else {
                return EpochStatus.DOES_NOT_EXIST;
            }
        };
        setIsLoading(true);
        setEpochStatus(calculateStatus());
        setIsLoading(false);
    }, [epochInfo, asset, auction, searchEpoch, api]);

    return {
        isLoading: isLoading || isEpochProgramLoading,
        epochInfo,
        auction,
        asset,
        refreshAuction,
        searchEpoch,
        epochStatus,
        isCurrentEpoch
    };
};