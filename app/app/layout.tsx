import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SolanaProviders from "@/providers/SolanaProviders";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Epochs",
  description: "One Epoch, every epoch. Forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SolanaProviders>
      <html lang="en">
        <body className={inter.className}>
          <Navbar />
          {children}
        </body>
      </html>
    </SolanaProviders>

  );
}
