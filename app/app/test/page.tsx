"use client"
import { useEpoch } from "@/hooks/useProgram";

export default function Home() {
    const currentTime = "07:50:16";
    const currentAmpm = "am";
    const currentDate = "Saturday, March 30, 2024";
    const currentTimezone = "Sun: ↑ 06:51AM ↓ 07:38PM (12h 47m) - More info";



    return (
        <div className="bg-black text-white min-h-screen">
            <TimeDisplay time={currentTime} ampm={currentAmpm} date={currentDate} timezone={currentTimezone} />
            {/* More components such as city times can be included here */}
        </div>



    );
}


interface TimeDisplayProps {
    time: string;
    ampm: string;
    date: string;
    timezone: string;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ date, timezone }) => {
    const { epochInfo } = useEpoch();
    if (!epochInfo) return null;
    const progress = ((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(2);
    return (
        <div className="flex flex-col items-left my-12 ml-8">
            <p className="text-sm sm:text-base text-gray-300">solana mainnet beta v1.18</p>
            <div className="text-4xl">epoch #</div>
            <div className="text-9xl sm:text-mega leading-none font-bold tracking-tighter">
                {epochInfo.epoch}
            </div>
            <p className="text-base text-gray-300">progress to next epoch:{progress} %</p>
        </div>
    );
};
