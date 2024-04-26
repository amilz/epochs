"use client"
import About from "@/components/About";
import { ActiveEpoch } from "@/components/EpochInfo/ActiveEpoch";

export default function Home() {

  return (
    <div className="text-white ">
      <ActiveEpoch  /> 
      <About />
    </div>
  );
}
