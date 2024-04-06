import React from 'react';
import { AssetProps } from './types';
import Image from 'next/image';

export const AssetImage: React.FC<AssetProps> = ({ src }) => (
    <div className="flex-shrink-0 mx-14">
        <Image src={src} alt="NFT" className="h-auto w-auto max-w-xs rounded-lg" width={600} height={600} />
    </div>
);
