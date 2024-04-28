import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SolanaProviders from "@/providers/SolanaProviders";
import DevnetWarning from "@/components/DevnetWarning";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Epochs",
  description: "One Epoch, every epoch. Forever.",
  creator: "amilz",
  icons: ["favicon.ico"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SolanaProviders>
      <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" />
        <body className={`${inter.className} flex flex-col mx-auto px-4 py-2 max-w-5xl text-white`}>
          <Navbar />
          {children}
          <DevnetWarning />
        </body>
      </html>
    </SolanaProviders>
  );
}
