"use client"
import { ActiveEpoch } from "@/components/EpochInfo/ActiveEpoch";

export default function Home() {

  return (
    <div className="text-white ">
      {/* IF !ACTIVE - BIG INIT BUTTON */}
      {/* IF ACTIVE - <ActiveEpoch />*/}
      <ActiveEpoch  /> {/*  should be EPOCH, ASSET, AUCTION */}
    </div>
  );
}
