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
import { useWallet } from "@solana/wallet-adapter-react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/UI/Arrows"
import { LAMPORTS_PER_SOL } from "@solana/web3.js";


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
    // Add error handling
    if (isLoading || !searchEpoch) return <Spinner />;

    // Type 1 is the attributes extension

    const showOwner = epochStatus === 'COMPLETE' && !!asset?.assetWithoutExtensions.holder;
    //const additionalTrait = { name: "Epoch", value: searchEpoch.toString() };
    const winningBid = (!isCurrentEpoch && auction) ? { name: "Winning Bid", value: "Ξ " + (auction.highBidLamports.toNumber() / LAMPORTS_PER_SOL).toLocaleString(undefined, { maximumFractionDigits: 2 }) } : undefined;
    const ownerTrait = (showOwner && asset) ? { name: "Owner", value: shortenHash(asset.assetWithoutExtensions.holder.toString()) } : undefined;
    const traits = asset?.extensions.find((ext) => ext.type === TRAITS_TYPE_INDEX)?.attributesComponents?.traits || [];
    const combinedTraits: TraitComponents[] = asset ? [...traits, winningBid, ownerTrait].filter(isDefined) : [];

    const showAuction = epochStatus === 'ACTIVE' || epochStatus === 'NOT_YET_STARTED';
    const canClaim = epochStatus === "UNCLAIMED" && pubkey?.toBase58() === auction?.highBidder.toBase58();


    const prevEpoch = searchEpoch - 1;
    const nextEpoch = searchEpoch + 1;

    const showPrevEpoch = prevEpoch > 19; // TODO UPDATE FOR PROD
    const showNextEpoch = !isCurrentEpoch;
    // using static image here due to having wrong color on initial testnet deploy
    const imgSrc = searchEpoch == 20 ? '/epoch20.png' : asset?.png; // TODO UPDATE FOR PROD
    return (
        <EpochOverlay
            prevPath={showPrevEpoch ? `/epoch/${prevEpoch.toString()}` : undefined}
            nextPath={showNextEpoch ? `/epoch/${nextEpoch.toString()}` : undefined}
        >

            <div className="flex flex-col items-start my-12 mx-6">
                <EpochNumber epoch={searchEpoch} />
                <EpochProgress isCurrentEpoch={isCurrentEpoch} />

                {/* Bottom half content */}

                {asset && imgSrc && (
                    <div className="flex flex-col lg:flex-row w-full text-sm text-white mt-8">
                        {/* AssetImage will show up on top on mobile and on the left on desktop */}
                        <div className="mb-4 lg:mb-0 flex-shrink-0">
                            <AssetImage src={imgSrc} />
                        </div>
                        {/* AssetTraits will be in the middle on desktop */}
                        <div className="flex-grow">
                            <AssetTraits traits={combinedTraits} />
                        </div>
                        {/* Auction will be on the bottom on mobile and on the right on desktop */}

                        <div className="w-full lg:w-auto lg:flex-shrink-0 ">

                            {showAuction && <Auction />}
                            {epoch && canClaim && <ClaimButton epochNumber={epoch} />}
                        </div>

                    </div>
                )}

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
