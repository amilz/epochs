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
        <header className="bg-gray-900 text-white flex justify-between items-center p-4">
            <div className="flex items-center">
                <Link href="/" passHref>
                    Epochs
                </Link>
            </div>
            <nav className="hidden md:flex md:items-center">
                {links.map((link) => (
                    <Link key={link.title} href={link.href} passHref className="text-white px-4 py-2 hover:bg-gray-700 transition-colors duration-200 ease-in-out">
                        {link.title}
                    </Link>
                ))}
            </nav>
            <div className="flex items-center">
                <WalletMultiButtonDynamic />
            </div>
        </header>
    );

};

export default Navbar;