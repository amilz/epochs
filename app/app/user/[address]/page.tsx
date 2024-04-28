"use client";
import { useEpochProgram } from "@/hooks/useProgram";
import { useCallback, useEffect, useState } from "react";
import { getPubkeyIfValid, shortenHash } from "@/utils/utils";
import { DeserializedAssetNoEpoch } from "@/utils/types";

import Image from 'next/image';
import { User } from "@/components/User/User";
import { PublicKey } from "@solana/web3.js";

const AssetCard = ({ asset }: { asset: DeserializedAssetNoEpoch }) => (
  <div className="w-full md:w-1/3 p-4 text-center">
    <Image
      src={asset.png}
      alt={asset.assetWithoutExtensions.name}
      className="h-auto md:max-w-xs rounded-lg bg-[#222222]"
      width={300}
      height={300}
    />
    <p className="text-lg">{asset.assetWithoutExtensions.name}</p>
  </div>
);

const LoadingCard = () => (
  <div className="w-full md:w-1/3 p-4 text-center">
    <Image
      src={"/loading.gif"}
      alt={"loading"}
      className="h-auto md:max-w-xs rounded-lg bg-[#222222]"
      width={300}
      height={300}
    />
  </div>
);


export default function Page({ params }: { params: { address: string } }) {
  const [reputation, setReputation] = useState<number>(0);
  const [assets, setAssets] = useState<DeserializedAssetNoEpoch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { api } = useEpochProgram();
  const address = params.address;

  const validateAddress = useCallback(() => {
    if (!address) {
      setError("Invalid address.");
    }
    getPubkeyIfValid(address)
      ? setError(null)
      : setError("Invalid address.");
  }, [address]);

  useEffect(() => {
    validateAddress();
  }, [validateAddress]);

  const refreshReputation = useCallback(() => {
    if (!address || !api) return;
    setError(null);
    try {
      const user = getPubkeyIfValid(address);
      if (!user) throw new Error("Invalid address.");
      api.fetchReputation({ user })
          .then(({ reputation }) => setReputation(reputation.toNumber()))
          .catch(error => {
              setError("Failed to fetch reputation. Please try again.");
          });
  } catch (error) {
      setError("Invalid address.");
  }  }, [api, address]);

  useEffect(() => {
    refreshReputation();
  }, [refreshReputation]);

  const getEpochs = useCallback(() => {
    if (!address || !api) return;

    setError(null);
    try {
      const user = getPubkeyIfValid(address);
      if (!user) throw new Error("Invalid address.");
      setLoading(true);      
      api.fetchEpochsByOwner({ owner: user })
          .then(setAssets)
          .finally(() => setLoading(false))
  } catch (error) {
      setError("Invalid address.");
  }
  }, [api, address]);

  useEffect(() => {
    getEpochs();
  }, [getEpochs]);



  return (
    <div className="text-white mb-8">
      <User address={address} reputation={reputation} >
        {error && <div className="text-white text-lg mt-4"> {error} </div>}
        {!error && (loading ? <LoadingCard />
          : assets.length ?
            assets.map((asset, index) => (
              <AssetCard key={index} asset={asset} />
            ))
            : <div className=" text-lg mt-4"> No epochs found. </div>)}
      </User>
    </div>
  );
}

/*
      <div className="max-w-7xl mx-auto p-4 pt-6 lg:p-8 lg:pt-12">
          <div className="text-white text-lg">
            <h1>{shortenHash(address)}'s Epochs:</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset, index) => (
              <AssetCard key={index} asset={asset} />
            ))}
          </div>
          <div className="text-white text-lg">
            <h1>Reputation</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ReputationCard reputation={reputation} />
          </div>
        </div> 
*/