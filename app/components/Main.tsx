"use client"
import { useEpoch } from '@/hooks/useProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

const Main = () => {
    const [currentEpoch, setCurrentEpoch] = useState<number>(0);
    const { connected } = useWallet();
    const { epochClient } = useEpoch();

    useEffect(() => {
        const fetchData = async () => {
            const { epoch } = await epochClient.connection.getEpochInfo();
            setCurrentEpoch(epoch);
        };

        // fetchData();

        //const interval = setInterval(fetchData, 5000); // Fetch data every 5 seconds

        return () => {
            //  clearInterval(interval); // Clean up the interval on component unmount
        };
    }, [epochClient, setCurrentEpoch]);

    return (
        <div className="flex flex-col items-center justify-between p-24">
            <div>Current Epoch: {currentEpoch}</div>
            {connected ?
                <div>Wallet Connected</div>
                :
                <div>Wallet Not Connected</div>}
        </div>
    )
}
export default Main;