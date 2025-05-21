"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { CreateOfferDialog } from "@/components/create-offer-dialog";
import { OfferCard } from "@/components/offer-card";
import { cn } from "@/lib/utils";
import { useGlobalContext } from "@/context/global-context";
import { useWallet } from "@suiet/wallet-kit";
import { getAllOffers, getProfile } from "@/lib/calls";

export function MarketplaceContent() {
  const [activeTab, setActiveTab] = useState("buy");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const { offers, setOffers } = useGlobalContext();
  const wallet = useWallet();
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    async function fetchOffersAndProfiles() {
      try {
        const data = await getAllOffers();
        setOffers(data);

        const uniqueOwners = [...new Set(data.map(offer => offer.owner))];

        const profilePromises = uniqueOwners.map(async (address) => {
          const profile = await getProfile(address);
          return { address, ...profile };
        });
        const profilesData = await Promise.all(profilePromises);

        const profileMap = new Map(profilesData.map(p => [p.address, p]));
        setProfiles(profileMap);
      } catch (error) {
        console.error("Error fetching offers and profiles:", error);
      }
    }
    fetchOffersAndProfiles();
  }, []);

  const filteredOffers = offers.filter((offer) => {
    if (activeTab === "buy" && offer.owner === wallet.account?.address) return false;
    if (activeTab === "sell" && offer.owner !== wallet.account?.address) return false;
    if (searchQuery && !offer.owner.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedCurrency !== "all" && offer.currencyCode !== selectedCurrency) return false;
    if (selectedPaymentMethod !== "all" && offer.paymentType !== selectedPaymentMethod) return false;
    return true;
  });

  const uniqueCurrencies = [...new Set(offers.map((offer) => offer.currencyCode))];
  const uniquePaymentMethods = [...new Set(offers.map((offer) => offer.paymentType))];

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight cetus-text">P2P Marketplace</h1>
          <p className="text-muted-foreground">
            Buy and sell cryptocurrencies directly with other users using your preferred payment methods.
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by merchant name..."
                className="w-full pl-8 bg-cetus-dark border-cetus-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="w-[120px] bg-cetus-dark border-cetus-border">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-cetus-dark border-cetus-border">
                  <SelectItem value="all">All</SelectItem>
                  {uniqueCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger className="w-[180px] bg-cetus-dark border-cetus-border">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-cetus-dark border-cetus-border">
                  <SelectItem value="all">All Methods</SelectItem>
                  {uniquePaymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <CreateOfferDialog />
            </div>
          </div>

          <Tabs defaultValue="buy" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-cetus-dark rounded-lg p-1">
              <TabsTrigger
                value="buy"
                className={cn(
                  "rounded-md text-sm",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cetus-primary data-[state=active]:to-cetus-accent data-[state=active]:text-cetus-darker"
                )}
              >
                Buy SUI
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className={cn(
                  "rounded-md text-sm",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cetus-primary data-[state=active]:to-cetus-accent data-[state=active]:text-cetus-darker"
                )}
              >
                Sell SUI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-0">
              <div className="grid gap-4">
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      profile={profiles.get(offer.owner)}
                      wallet={wallet}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No offers found matching your criteria.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sell" className="mt-0">
              <div className="grid gap-4">
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      profile={profiles.get(offer.owner)}
                      wallet={wallet}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No offers found matching your criteria.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceContent;