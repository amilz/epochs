import React from 'react';
import { EpochInfo } from './types';
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/UI/Arrows"

export const EpochNumber: React.FC<EpochInfo> = ({ epoch }) => {

  return (
    <>
      <div className="text-4xl">epoch #</div>
      <div className="text-8xl sm:text-mega leading-none font-extrabold tracking-tighter">
        {epoch}
      </div>
    </>
  )
};


const EpochNavigation = ({
  prevEpoch,
  nextEpoch,
  showPrevEpoch,
  showNextEpoch,
}: {
  prevEpoch: number;
  nextEpoch: number;
  showPrevEpoch: boolean;
  showNextEpoch: boolean;
}) => {
  return (
    <div className="flex items-center justify-between">
      {showPrevEpoch && <a
        href={`/epoch/${prevEpoch.toString()}`}
        className="flex items-center justify-center pointer-events-auto w-12 hover:bg-gradient-to-r from-gray-900 to-transparent focus:outline-none"
        style={{ opacity: 0.7 }}
      >
        <ChevronLeftIcon className="w-6 h-6 text-white hover:text-gray-500" />
      </a>}
      {showNextEpoch && <a
        href={`/epoch/${nextEpoch.toString()}`}
        className="flex items-center justify-center pointer-events-auto w-12 hover:bg-gradient-to-r from-gray-900 to-transparent focus:outline-none"
        style={{ opacity: 0.7 }}
      >
        <ChevronRightIcon className="w-6 h-6 text-white hover:text-gray-500" />
      </a>}
    </div>
  )
}