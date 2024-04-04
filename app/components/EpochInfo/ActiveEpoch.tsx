"use client"
import { AssetImage } from "@/components/EpochInfo/AssetImage";
import { AssetTraits } from "@/components/EpochInfo/AssetTraits";
import { EpochNumber } from "@/components/EpochInfo/EpochNumber";
import { EpochProgress } from "@/components/EpochInfo/EpochProgress";
import { useEpoch } from "@/hooks/useEpoch";
import { ActiveEpochProps } from "./types";
import { TRAITS_TYPE_INDEX } from "@/utils/constants";
import Auction from "../Auction/Auction";


export const ActiveEpoch: React.FC<ActiveEpochProps> = ({ epoch }: ActiveEpochProps) => {
    const { asset, epochStatus, isCurrentEpoch, isLoading, searchEpoch } = useEpoch({ epochNumber: epoch });

    if (isLoading) return <div>Loading...</div>;
    // Add error handling
    if (!searchEpoch) return <div>Epoch information is not available.</div>;

    // Type 1 is the attributes extension
    const additionalTrait = { name: "Epoch", value: searchEpoch.toString() };
    const traits = asset?.extensions.find((ext) => ext.type === TRAITS_TYPE_INDEX)?.attributesComponents?.traits || [];
    const combinedTraits = asset ? [...traits, additionalTrait] : [];

    return (
        <div className="flex flex-col items-start my-12 ml-8 ">
            {/* <div className="text-4xl">{epochStatus}</div> */}
            <EpochNumber epoch={searchEpoch} />
            {isCurrentEpoch && <EpochProgress />}
            {/* Bottom half content */}
            {asset && <div className="flex mt-8 items-start text-sm text-white ">
                <AssetTraits traits={combinedTraits} />
                <AssetImage src={asset.png} />
            </div>}

            <Auction /> 
        
        </div>
    );
};


