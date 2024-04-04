import React from 'react';
import { TraitComponents } from './types';

export const AssetTraits: React.FC<{ traits: TraitComponents[] }> = ({ traits }) => (
    <div className="flex-col min-w-64">
        {traits.map((attribute, index) => (
            <div key={index} className="mb-4">
                <p className="text-white font-bold">
                    {attribute.name}
                </p>
                <p>
                    {attribute.value}
                </p>
            </div>
        ))}
    </div>
);