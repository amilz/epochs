"use client"
import { useEpoch } from "@/hooks/useEpoch";
import { useEpochProgram } from "@/hooks/useProgram";

export default function Home() {

    return (
        <div className="text-white ">
            <ActiveEpoch />
            {/* More components such as city times can be included here */}
        </div>
    );
}



const ActiveEpoch: React.FC = () => {
    const { epochInfo } = useEpochProgram();
    const { asset } = useEpoch({});
    console.log(asset);

    if (!epochInfo) return null;
    const progress = ((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(2);

    // Type 1 is the attributes extension
    const traits = asset?.extensions.find((ext) => ext.type === 1)?.attributesComponents?.traits || [];
    traits.push({ name: "Epoch", value: epochInfo.epoch.toString() });

    return (
        <div className="flex flex-col items-start my-12 ml-8 ">
            <div className="text-4xl">epoch #</div>
            <div className="text-8xl sm:text-mega leading-none font-extrabold tracking-tighter">
                <span className="text-gray-300"> </span>{epochInfo.epoch}
            </div>
            <div className="w-full flex items-center">
                <p className="text-base text-gray-300 mr-2">progress to next epoch: {progress}%</p>
                <div className="flex-1 h-2 bg-zinc-900 mr-4">
                    <div className="h-2 bg-white" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
            <p className="text-sm text-gray-300">solana mainnet beta v1.18</p>

            {/* Bottom half content */}
            <div className="flex mt-8 items-start text-sm text-white ">
                <div className="flex-col min-w-64">
                    {traits && traits.map((attribute, index) => (
                        <div key={index} className="mb-4 flex-grow  max-w-60"> {/* Use min-w-sm or any other min width class as needed */}
                            <p className="text-white font-bold">
                                {attribute.name}
                            </p>
                            <p>
                                {attribute.value}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="flex-shrink-0 mx-14">
                    <div className=" ">
                        {asset && <img src={asset.png} alt="NFT" className="h-auto w-auto max-w-xs rounded-lg" />}
                    </div>
                </div>
            </div>
        </div>
    );
};