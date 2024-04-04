"use client"
import { AssetImage } from "@/components/EpochInfo/AssetImage";
import { AssetTraits } from "@/components/EpochInfo/AssetTraits";
import { EpochNumber } from "@/components/EpochInfo/EpochNumber";
import { EpochProgress } from "@/components/EpochInfo/EpochProgress";
import { useEpoch } from "@/hooks/useEpoch";
import { ActiveEpochProps } from "./types";
import { TRAITS_TYPE_INDEX } from "@/utils/constants";
import Auction from "../Auction/Auction";
import { TraitComponents } from './types';
import ClaimButton from "../Auction/ClaimButton";
import { shortenHash } from "@/utils/utils";
import EpochOverlay from "./EpochOverlay";


export const ActiveEpoch: React.FC<ActiveEpochProps> = ({ epoch }: ActiveEpochProps) => {
    const {
        asset,
        epochStatus,
        isCurrentEpoch,
        isLoading,
        searchEpoch,
    } = useEpoch({ epochNumber: epoch });
    // Add error handling
    if (isLoading || !searchEpoch) return <Spinner />;

    // Type 1 is the attributes extension

    const showOwner = epochStatus === 'COMPLETE' && !!asset?.assetWithoutExtensions.holder;
    const additionalTrait = { name: "Epoch", value: searchEpoch.toString() };
    const ownerTrait = showOwner ? { name: "Owner", value: shortenHash(asset?.assetWithoutExtensions.holder.toString() ?? '') } : undefined;
    const traits = asset?.extensions.find((ext) => ext.type === TRAITS_TYPE_INDEX)?.attributesComponents?.traits || [];
    const combinedTraits: TraitComponents[] = asset ? [...traits, additionalTrait, ownerTrait].filter(isDefined) : [];

    const showAuction = epochStatus === 'ACTIVE' || epochStatus === 'NOT_YET_STARTED';

    const prevEpoch = searchEpoch - 1;
    const nextEpoch = searchEpoch + 1;

    const showPrevEpoch = prevEpoch > 0;
    const showNextEpoch = !isCurrentEpoch;

    return (
        <EpochOverlay
            prevPath={showPrevEpoch ? `/epoch/${prevEpoch.toString()}` : undefined}
            nextPath={showNextEpoch ? `/epoch/${nextEpoch.toString()}` : undefined}
        >
            <div className="flex flex-col items-start my-12 ml-16 ">
                <EpochNumber epoch={searchEpoch} />
                {isCurrentEpoch && <EpochProgress />}
                {/* Bottom half content */}
                {asset && <div className="flex mt-8 items-start text-sm text-white ">
                    <AssetTraits traits={combinedTraits} />
                    <AssetImage src={asset.png} />
                </div>}
                {showAuction && <Auction />}
                {epoch && <ClaimButton epochNumber={epoch} />}
            </div>
        </EpochOverlay>
    );
};

// Type Guards for Traits
function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

const Spinner = () => (
    <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-20 w-20 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0116 0H4z"></path>
        </svg>
    </div>
);
