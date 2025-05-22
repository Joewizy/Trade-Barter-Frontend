"use client";

import { WalletProvider } from "@suiet/wallet-kit"
import "@suiet/wallet-kit/style.css";
import "./custom-styles.css"
import React from 'react';

export default function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      {children as any}
    </WalletProvider>
  )
}
