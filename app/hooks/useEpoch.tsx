import { useState, useEffect, useCallback } from "react";
import { Auction } from "@epochs/api/utils/types";
import { useEpochProgram } from "./useProgram";
import { DeserializedAsset } from "@/utils/types";

interface Props {
    epochNumber?: number;
}

export const useEpoch = ({ epochNumber }: Props) => {
    const [auction, setAuction] = useState<Auction>();
    const [asset, setAsset] = useState<DeserializedAsset>();
    const [isLoading, setIsLoading] = useState(false);

    const { api, epochInfo } = useEpochProgram();

    const refreshAuction = useCallback(() => {
        if (!epochInfo) return;
        if (!api) return;
        if (!epochInfo.epoch) return;
        if (!activeEpoch) return;
        setIsLoading(true);
        api.fetchAuction({ epoch: activeEpoch })
            .then(setAuction)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [api, epochInfo, epochNumber]);

    useEffect(() => {
        refreshAuction();
    }, [refreshAuction]);

    useEffect(() => {
        if (!api) return;
        if (!auction) return;
        if (!epochInfo) return;
        if (!activeEpoch) return;
        setIsLoading(true);
        api.fetchAssetAndImageByEpoch({ epoch: activeEpoch })
            .then((asset) => {
                setAsset(asset);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [api, auction, epochInfo, epochNumber]);

    const activeEpoch = epochNumber || epochInfo?.epoch;

    return { isLoading, epochInfo, auction, asset, epochClient: api, refreshAuction, activeEpoch };
};



// const [transaction, setTransaction] = useState<Transaction>();

// const { publicKey: payer } = useWallet();



