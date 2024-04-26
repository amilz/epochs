"use client"
import About from "@/components/About";
import { ActiveEpoch } from "@/components/EpochInfo/ActiveEpoch";
import { LoadingEpoch } from "@/components/EpochInfo/LoadingEpoch";
import { useEpochProgram } from "@/hooks/useProgram";

export default function Home() {
  const { epochInfo } = useEpochProgram();

  return (
    <div className="text-white ">
      {/* We render a LoadingEpoch to prevent About preloading without Epoch component blocks */}
      {epochInfo ? <ActiveEpoch epoch={epochInfo.epoch} /> : <LoadingEpoch />}
      <About />
    </div>
  );
}
