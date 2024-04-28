"use client"

import { shortenHash } from "@/utils/utils";

interface Props {
    address: string;
    reputation: number;
    children: React.ReactNode;
}

export const User: React.FC<Props> = ({ address, reputation, children }: Props) => {
    const progressWidth = calculateProgressWidth(reputation);

    return (
        <div className="flex flex-col items-start my-12 mx-6">
            <AddressLabel address={address} />
            <>
                <div className="w-full min-w-80	flex items-center">
                    <p className="text-base text-gray-300 mr-2">{`reputation: ${reputation}`}</p>
                    <div className="flex-1 h-2 bg-zinc-700 ">
                        <div className="h-2 bg-white" style={{ width: `${progressWidth}%` }}></div>
                    </div>
                </div>
                <p className="text-sm text-gray-300">{'eclipse testnet'}</p>
            </>
            {/* HERE */}
            <div className="flex flex-wrap -m-1">
                {children}
            </div>
        </div>
    );
};

const calculateProgressWidth = (reputation: number) => {
    if (reputation === 0) return 0;
    const factor = Math.pow(10, Math.floor(Math.log10(reputation)) + 1);
    return (reputation / factor) * 100;
};


const AddressLabel: React.FC<{ address: string }> = ({ address }: { address: string }) => {
    const text = 'wallet address:';
    return (
        <>
            <div className="text-4xl">{shortenHash(address)}&apos;s</div>
            <div className="text-8xl sm:text-mega leading-none font-extrabold tracking-tighter">
                {'epochs'}
            </div>
        </>
    )
};
