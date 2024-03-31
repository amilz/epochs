import { useConnection } from "@solana/wallet-adapter-react";
import { createContext, ReactNode, useContext, useEffect, useState, useMemo } from "react";
import { EpochClient } from "@epochs/api";
import { EpochInfo } from "@solana/web3.js";

export interface EpochsProgramContextState {
    api?: EpochClient;
    epochInfo?: EpochInfo;
    isLoading: boolean;
}

export const EpochProgramContext = createContext<EpochsProgramContextState>(
    {} as EpochsProgramContextState
);

export function useEpochProgram(): EpochsProgramContextState {
    return useContext(EpochProgramContext);
}

export function EpochProgramProvider(props: { children: ReactNode }): JSX.Element {
    const [api, setApi] = useState<EpochClient>();
    const [isLoading, setIsLoading] = useState(false);
    const [epochInfo, setEpochInfo] = useState<EpochInfo>();
    const { connection } = useConnection();

    useEffect(() => {
        setApi(EpochClient.from(connection));
    }, [connection]);

    useEffect(() => {
        if (!api) return;
        setIsLoading(true);
        api.getCurrentEpochInfo()
            .then(setEpochInfo)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [api]);

    const value = useMemo(() => ({ api, epochInfo, isLoading }), [api, epochInfo, isLoading]);

    return (
        <EpochProgramContext.Provider value={value}>
            {props.children}
        </EpochProgramContext.Provider>
    );

}
