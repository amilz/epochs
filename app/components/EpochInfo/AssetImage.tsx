import React from 'react';
import { AssetProps } from './types';
import Image from 'next/image';

export const AssetImage: React.FC<AssetProps> = ({ src }) => (
    <div className="flex-shrink-0 sm:mx-4">
        <Image src={src} alt="NFT" className="h-auto w-full md:max-w-xs rounded-lg" width={600} height={600} layout="responsive" />
    </div>
);
