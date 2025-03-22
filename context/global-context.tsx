"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkProfileExists, getAllOffers } from "@/lib/calls";
import { useWallet } from "@suiet/wallet-kit";
import { SuiObjectData } from "@mysten/sui/client";

// Define the context type
interface GlobalContextType {
  profileCreated: boolean;
  setProfileCreated: (value: boolean) => void;
  offers: (SuiObjectData | null | undefined)[];
  setOffers: React.Dispatch<React.SetStateAction<(SuiObjectData | null | undefined)[]>>;
}
// Create the context
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Create the provider component
export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileCreated, setProfileCreated] = useState(false);
  const [offers, setOffers] = useState<(SuiObjectData | null | undefined)[]>([]);
  
  const wallet = useWallet();

  async function makeCheck() {
    if (wallet.connected) {
      let res = await checkProfileExists(wallet);
      setProfileCreated(res.result);
    }
  }

  async function getOffers() {
    let offers = await getAllOffers();
    setOffers(offers);
    console.log('All Offers: ', offers);
  }

  useEffect(() => {
    makeCheck()
    getOffers();
    
  }, [wallet.connected])

  return (
    <GlobalContext.Provider value={{ profileCreated, setProfileCreated, offers, setOffers }}>
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook to use the global context
export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};

