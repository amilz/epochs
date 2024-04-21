import React from 'react';

const DevnetWarning: React.FC = () => {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-red-600 text-white text-center p-3">
      <span>Eclipse Testnet (must use Eclipse-compatible wallet) - </span>
      <a href="https://docs.eclipse.xyz/developers/wallet" target="_blank" rel="noopener noreferrer" className="underline">
        Get wallet & dev ETH here
      </a>
    </div>
  );
};

export default DevnetWarning;
