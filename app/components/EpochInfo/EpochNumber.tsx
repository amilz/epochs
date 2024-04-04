import React from 'react';
import { EpochInfo } from './types';

export const EpochNumber: React.FC<EpochInfo> = ({ epoch }) => (
  <>
    <div className="text-4xl">epoch #</div>
    <div className="text-8xl sm:text-mega leading-none font-extrabold tracking-tighter">
      <span className="text-gray-300"> </span>{epoch}
    </div>
  </>
);
