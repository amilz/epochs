import React from 'react';
import { TraitComponents } from './types';

export const AssetTraits: React.FC<{ traits: TraitComponents[] }> = ({ traits }) => (
    <div className="grid sm:grid-cols-1 grid-cols-2 gap-4">
      {traits.map((attribute, index) => (
        <div key={index} className="sm:mb-4">
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
  