"use client"
import { AssetImage } from "@/components/EpochInfo/AssetImage";
import { AssetTraits } from "@/components/EpochInfo/AssetTraits";
import { EpochNumber } from "@/components/EpochInfo/EpochNumber";
import { EpochProgress } from "@/components/EpochInfo/EpochProgress";
import { useEpoch } from "@/hooks/useEpoch";
import { useEpochProgram } from "@/hooks/useProgram";
import { Asset } from "next/font/google";

export default function Home() {

  return (
    <div className="text-white ">
      {/* IF !ACTIVE - BIG INIT BUTTON */}
      {/* IF ACTIVE - <ActiveEpoch />*/}
      <ActiveEpoch /> {/*  should be EPOCH, ASSET, AUCTION */}
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
      <EpochNumber epoch={epochInfo.epoch} />
      <EpochProgress progress={progress} />
      {/* Bottom half content */}
      {asset && <div className="flex mt-8 items-start text-sm text-white ">
        <AssetTraits traits={traits} />
        <AssetImage src={asset.png} />
      </div>}
    </div>
  );
};


