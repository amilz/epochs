import React from 'react';
import { AssetProps } from './types';

export const AssetImage: React.FC<AssetProps> = ({ src }) => (
    <div className="flex-shrink-0 mx-14">
        <img src={src} alt="NFT" className="h-auto w-auto max-w-xs rounded-lg" />
    </div>
);
