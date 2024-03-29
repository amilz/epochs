import { useConnection } from "@solana/wallet-adapter-react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { EpochClient } from "@epochs/api";
import { Auction } from "@epochs/api/utils/types";

export interface EpochsProgramContextState {
    epochClient: EpochClient;
    epoch: number;
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
    const [epoch, setEpoch] = useState<number>(0);
    const [auction, setAuction] = useState<Auction>();
    const { connection } = useConnection();

    useEffect(() => {
        setApi(EpochClient.from(connection));
    }, [connection, setApi]);

    const refreshAuction = useCallback(() => {
        if (!api) return;
        if (!epoch) return;
        api.fetchAuction({ epoch })
            .then((auction) => {
                if (!auction) {
                    setAuction(undefined);
                    return;
                }
                setAuction(auction);
            })
            .catch((err) => {
                setAuction(undefined);
            });
    }, [api, setAuction, epoch]);

    useEffect(() => {
        if (!api) return;
        api.getCurrentEpoch().then((epoch) => {
            setEpoch(epoch);
            refreshAuction();
        });
    }, [api, epoch, refreshAuction]);


    const value: EpochsProgramContextState = {
        epochClient: api as EpochClient,
        epoch,
        refreshAuction,
        auction
    };

    return (
        <EpochProgramContext.Provider value={value}>
            {props.children}
        </EpochProgramContext.Provider>
    );

}
