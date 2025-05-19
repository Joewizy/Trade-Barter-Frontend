"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { checkProfileExists, getAllOffers } from "@/lib/calls"; 
import { useWallet } from "@suiet/wallet-kit";
import { Offer } from "@/types/trade.types"; 

interface GlobalContextType {
  profileCreated: boolean; // State for whether the user has created a profile
  setProfileCreated: (value: boolean) => void; // Method to update profileCreated state
  offers: Offer[]; // The list of offers
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>; // Method to update the offers state
}

// Create the context
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Create the provider component
export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileCreated, setProfileCreated] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);  

  const wallet = useWallet();

  async function makeCheck() {
    if (wallet.connected) {
      const res = await checkProfileExists(wallet); 
      setProfileCreated(res.result); 
    }
  }

  async function getOffers() {
    const offers = await getAllOffers(); 
    setOffers(offers);  
  }

  // useEffect to trigger profile check and offer fetching when wallet connection status changes
  useEffect(() => {
    makeCheck();  // Check if the profile exists
    getOffers();  // Fetch offers
  }, [wallet.connected]);

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
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};
