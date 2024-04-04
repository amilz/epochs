'use client'
import React from "react";
import dynamic from "next/dynamic";
import Link from 'next/link';

const WalletMultiButtonDynamic = dynamic(
    async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
    { ssr: false }
);


interface NavLink {
    title: string;
    href: string;
}

const links: NavLink[] = [
    { title: 'Current Epoch', href: '/current' },
];

const Navbar = () => {
    return (
        <header className="sticky-top-0 right-0relative ">
            <div className="absolute top-4 right-4 ">
                <WalletMultiButtonDynamic />
            </div>
        </header>
    );

};

export default Navbar;