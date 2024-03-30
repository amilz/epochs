import { useConnection } from "@solana/wallet-adapter-react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState, useRef } from "react";
import { EpochClient } from "@epochs/api";
import { Auction } from "@epochs/api/utils/types";
import { EpochInfo } from "@solana/web3.js";

export interface EpochsProgramContextState {
    epochClient: EpochClient;
    epochInfo?: EpochInfo;
    refreshAuction: () => void;
    auction?: Auction;
}

export const EpochProgramContext = createContext<EpochsProgramContextState>(
    {} as EpochsProgramContextState
);

export function useEpoch(): EpochsProgramContextState {
    return useContext(EpochProgramContext);
}

export function EpochProgramProvider(props: { children: ReactNode }): JSX.Element {
    const [api, setApi] = useState<EpochClient>();
    const [epochInfo, setEpochInfo] = useState<EpochInfo>();
    const [auction, setAuction] = useState<Auction>();
    const { connection } = useConnection();
    const epochInfoRef = useRef<EpochInfo>();

    useEffect(() => {
        setApi(EpochClient.from(connection));
    }, [connection]);

    const refreshAuction = useCallback(() => {
        if (!api || !epochInfoRef.current) return;
        api.fetchAuction({ epoch: epochInfoRef.current.epoch })
            .then((fetchedAuction) => {
                setAuction(fetchedAuction || undefined);
            })
            .catch((err) => {
                setAuction(undefined);
            });
    }, [api]);


    useEffect(() => {
        if (!api) return;
        api.getCurrentEpochInfo().then((info) => {
            setEpochInfo(info);
            epochInfoRef.current = info;
            refreshAuction();
        });
    }, [api]);


    const value: EpochsProgramContextState = {
        epochClient: api as EpochClient,
        epochInfo,
        refreshAuction,
        auction
    };

    return (
        <EpochProgramContext.Provider value={value}>
            {props.children}
        </EpochProgramContext.Provider>
    );

}
