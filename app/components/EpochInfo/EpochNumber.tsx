'use client'
import React from 'react';
import { EpochInfo } from './types';

export const EpochNumber: React.FC<EpochInfo> = ({ epoch }) => {
  const text = epoch ? 'epoch #' : 'epoch';
  return (
    <>
      <div className="text-4xl">{text}</div>
      <div className="text-8xl sm:text-mega leading-none font-extrabold tracking-tighter">
        {epoch ?? 'loading'}
      </div>
    </>
  )
};