import React from 'react';

const DevnetWarning: React.FC = () => {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-red-600 text-white text-center p-3">
      <span>Devnet (must set wallet to devnet) - </span>
      <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="underline">
        Get dev SOL here
      </a>
    </div>
  );
};

export default DevnetWarning;
