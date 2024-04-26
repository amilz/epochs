"use client"
import { ActiveEpoch } from "@/components/EpochInfo/ActiveEpoch";
import About from "@/components/About";

export default function Page({ params }: { params: { epoch: string } }) {

  const epochNumber = params.epoch ? parseInt(params.epoch as string, 10) : null;

  if (!epochNumber) {
    return (
      <div>
        <h1>Invalid epoch number</h1>
      </div>
    );
  }

  return (
    <div className="text-white ">
      <ActiveEpoch epoch={epochNumber} />
      <About />
    </div>
  );
}
