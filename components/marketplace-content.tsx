"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { CreateOfferDialog } from "@/components/create-offer-dialog"
import { OfferCard } from "@/components/offer-card"
import { cn } from "@/lib/utils"
import { useGlobalContext } from "@/context/global-context"
import { getUserObjectIdsFromTable } from "@/lib/calls"
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client"
import { useWallet } from "@suiet/wallet-kit"

export function MarketplaceContent() {
  const [activeTab, setActiveTab] = useState("buy")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState("all")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all")
  const [processedOffers, setProcessedOffers] = useState([])
  const { offers } = useGlobalContext()

  const client = new SuiClient({
    url: getFullnodeUrl("testnet")
  });
  const wallet = useWallet();
  
  // Process the offers from the blockchain format to the format the OfferCard expects
  useEffect(() => {
    if (!offers) return

    const mappedOffers = offers.map(offer => {
      
      // Determine if this is a buy or sell offer
      // We'll consider it a "buy" offer if the user wants to sell SUI (buyer receives SUI)
      // And a "sell" offer if the user wants to buy SUI (seller gives SUI)
      const type = "buy" // Default to buy, you may need logic to determine buy/sell
      
      return {
        id: offer.objectId,
        type: type,
        merchant: {
          name: offer.content.fields.owner || "Unknown User", // The owner address or name if available
          completion: 98 // Default completion rate - you might want to fetch this from user profile
        },
        trades: 0, // Default value, you may want to fetch this from user profile
        price: offer.content.fields.price,
        amount: parseInt(offer.content.fields.locked_amount || 0) / 1_000_000_000, // Convert MIST to normal amount
        minAmount: 0.0001, // Default, not in contract
        maxAmount: parseInt(offer.content.fields.locked_amount || 1000) / 1_000_000_000, // Convert MIST to normal amount
        currency: offer.content.fields.currency_code,
        paymentMethods: [offer.content.fields.payment_type] // Convert single payment type to array
      }
    })

    setProcessedOffers(mappedOffers)
  }, [offers])

  useEffect(() => {
    console.log(process.env.NEXT_PUBLIC_PACKAGE_ID);
    const logUserOffersAndEscrows = async () => {
      if (!wallet.connected || !wallet.address) return;
  
      try {
        // Offer Table
        const offerRegistry = await client.getObject({
          id: process.env.NEXT_PUBLIC_OFFER_REGISTRY_ID as string,
          options: { showContent: true }
        });
        const offerTableId = offerRegistry.data?.content?.fields?.user_offers?.fields?.id?.id;
  
        // Escrow Table
        const escrowRegistry = await client.getObject({
          id: process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ID as string,
          options: { showContent: true }
        });
        const escrowTableId = escrowRegistry.data?.content?.fields?.user_escrows?.fields?.id?.id;
  
        if (offerTableId) {
          const offerIds = await getUserObjectIdsFromTable(client, offerTableId, wallet.address);
          console.log("📦 Offer IDs:", offerIds);
        }
  
        if (escrowTableId) {
          const escrowIds = await getUserObjectIdsFromTable(client, escrowTableId, wallet.address);
          console.log("💰 Escrow IDs:", escrowIds);
        }
      } catch (err) {
        console.error("Failed to fetch user offers/escrows:", err);
      }
    };
  
    logUserOffersAndEscrows();
  }, [wallet.connected]);
  

  const filteredOffers = processedOffers.filter((offer) => {
    // Filter by tab (buy/sell)
    if (offer.type !== activeTab) return false

    // Filter by search query (merchant name or address)
    if (searchQuery && !offer.merchant.name.toLowerCase().includes(searchQuery.toLowerCase())) return false

    // Filter by currency
    if (selectedCurrency !== "all" && offer.currency !== selectedCurrency) return false

    // Filter by payment method
    if (selectedPaymentMethod !== "all" && !offer.paymentMethods.includes(selectedPaymentMethod)) return false

    return true
  })

  // Get unique currencies from offers for dropdown
  const uniqueCurrencies = [...new Set(processedOffers.map(offer => offer.currency))]
  
  // Get unique payment methods from offers for dropdown
  const uniquePaymentMethods = [...new Set(
    processedOffers.flatMap(offer => offer.paymentMethods)
  )]

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
                  {uniqueCurrencies.map(currency => (
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
                  {uniquePaymentMethods.map(method => (
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
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cetus-primary data-[state=active]:to-cetus-accent data-[state=active]:text-cetus-darker",
                )}
              >
                Buy SUI
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className={cn(
                  "rounded-md text-sm",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-cetus-primary data-[state=active]:to-cetus-accent data-[state=active]:text-cetus-darker",
                )}
              >
                Sell SUI
              </TabsTrigger>
            </TabsList>

           
              <div className="grid gap-4">
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No offers found matching your criteria.</p>
                  </div>
                )}
              </div>
           

            <TabsContent value="sell" className="mt-0">
              <div className="grid gap-4">
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
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
  )
}

export default MarketplaceContent