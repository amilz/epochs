import React from 'react';
import { TraitComponents } from './types';
import { TRAIT_MAP_BODIES, TRAIT_MAP_HATS } from '@/utils/constants';

export const AssetTraits: React.FC<{ traits: TraitComponents[] }> = ({ traits }) => (
    <div className="grid sm:grid-cols-1 grid-cols-2 gap-4">
        {traits.map((attribute, index) => {
            let value = attribute.value;

            switch (attribute.name) {
                case "Hat":
                    value = TRAIT_MAP_HATS[parseInt(value)];
                    break;

                case "Body":
                    value = TRAIT_MAP_BODIES[parseInt(value)];
                    break;
                default:
                    // Handle default case here
                    break;
            }
            return (
                <div key={index} className="sm:mb-4">
                    <p className="text-white font-bold">
                        {attribute.name}
                    </p>
                    <p>
                        {value}
                    </p>
                </div>
            )
        })}
    </div>
);
