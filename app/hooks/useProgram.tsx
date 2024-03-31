import { useConnection } from "@solana/wallet-adapter-react";
import { createContext, ReactNode, useContext, useEffect, useState, useMemo } from "react";
import { EpochClient } from "@epochs/api";
import { EpochInfo } from "@solana/web3.js";

export interface EpochsProgramContextState {
    api?: EpochClient;
    epochInfo?: EpochInfo;

}

export const EpochProgramContext = createContext<EpochsProgramContextState>(
    {} as EpochsProgramContextState
);

export function useEpochProgram(): EpochsProgramContextState {
    return useContext(EpochProgramContext);
}

export function EpochProgramProvider(props: { children: ReactNode }): JSX.Element {
    const [api, setApi] = useState<EpochClient>();
    const [epochInfo, setEpochInfo] = useState<EpochInfo>();
    const { connection } = useConnection();

    useEffect(() => {
        setApi(EpochClient.from(connection));
    }, [connection]);

    useEffect(() => {
        if (!api) return;
        api.getCurrentEpochInfo()
            .then(setEpochInfo)
            .catch(console.error)
    }, [api]);

    const value = useMemo(() => {
        return {
            api,
            epochInfo,
        };
    }, [api, epochInfo]);

    return (
        <EpochProgramContext.Provider value={value}>
            {props.children}
        </EpochProgramContext.Provider>
    );

}
