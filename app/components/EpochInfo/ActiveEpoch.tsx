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
import { shortenHash } from "@/utils/utils";
import EpochOverlay from "./EpochOverlay";
import { useWallet } from "@solana/wallet-adapter-react";

export const ActiveEpoch: React.FC<ActiveEpochProps> = ({ epoch }: ActiveEpochProps) => {
    const {
        asset,
        auction,
        epochStatus,
        isCurrentEpoch,
        isLoading,
        searchEpoch,
    } = useEpoch({ epochNumber: epoch });
    const { publicKey: pubkey } = useWallet();

    const showOwner = epochStatus === 'COMPLETE' && !!asset?.assetWithoutExtensions.holder;
    const ownerTrait = (showOwner && asset) ? { name: "Owner", value: shortenHash(asset.assetWithoutExtensions.holder.toString()) } : undefined;
    const traits = asset?.extensions.find((ext) => ext.type === TRAITS_TYPE_INDEX)?.attributesComponents?.traits || [];
    const combinedTraits: TraitComponents[] = asset ? [...traits, ownerTrait].filter(isDefined) : [];
    const showTraits = combinedTraits.length > 0 && asset;
    const canClaim = epochStatus === "UNCLAIMED" && pubkey?.toBase58() === auction?.highBidder.toBase58();

    const imgSrc =
        (!isLoading && epochStatus === "NOT_YET_STARTED") ? '/new2.png' :
            (isLoading || !asset) ? '/loading.gif' :
                searchEpoch == 20 ? '/epoch20.png' // TODO UPDATE FOR PROD
                    : asset.png;
    return (
        <EpochOverlay
            searchEpoch={searchEpoch}
            isCurrentEpoch={isCurrentEpoch}
        >
            <div className="flex flex-col items-start my-12 mx-6">
                <EpochNumber epoch={searchEpoch} />
                <EpochProgress epoch={searchEpoch} />

                {/* Bottom half content */}

                <div className="flex flex-col lg:flex-row w-full text-sm text-white mt-8 lg:items-start justify-center">
                    {/* AssetImage will show up on top on mobile and on the left on desktop */}
                    <div className="mb-4 lg:mb-0 flex-shrink-0">
                        <AssetImage src={imgSrc} />
                    </div>
                    {/* AssetTraits will be in the middle on desktop */}
                    <div className="flex-grow">
                        {showTraits && <AssetTraits traits={combinedTraits} />}
                    </div>
                    {/* Auction will be on the bottom on mobile and on the right on desktop */}

                    <div className="w-full lg:w-auto lg:flex-shrink-0 h-[600]	">
                        <Auction epochNumber={epoch} showClaim={canClaim} />
                    </div>

                </div>

            </div>
        </EpochOverlay>
    );


};

// Type Guards for Traits
function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}
