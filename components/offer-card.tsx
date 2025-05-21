"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, BanknoteIcon as Bank, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createEscrow, deleteOffer } from "@/lib/calls";
import { useToast } from "@/hooks/use-toast";
import { WalletContextState } from "@suiet/wallet-kit";
import { toBaseUnits } from "@/lib/helper-functions";

export function OfferCard({ offer, profile, wallet }: { offer: any, profile: any, wallet: WalletContextState }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(0);
  const [fiatAmount, setFiatAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFiatAmount(amount * offer.price);
  }, [amount, offer.price]);

  const paymentMethodIcons: Record<string, JSX.Element> = {
    "Bank Transfer": <Bank className="h-4 w-4" />,
    "Credit Card": <CreditCard className="h-4 w-4" />,
    PayPal: <DollarSign className="h-4 w-4" />,
    Venmo: <Wallet className="h-4 w-4" />,
  };

  const handleTrade = async () => {
    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid SUI amount",
      });
      return;
    }

    const suiInBaseUnits = toBaseUnits(amount);

    try {
      setLoading(true);
      const response = await createEscrow(offer.id, suiInBaseUnits, wallet);

      if (response.result === true) {
        toast({
          title: "Success",
          description: "Escrow created successfully!",
        });
        setTimeout(() => {
          // router.push("/trades"); // Uncomment and adjust as needed
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Escrow failed",
          description: response.result || "Could not create escrow",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "An unexpected error occurred.",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!wallet) return;
    try {
      const result = await deleteOffer(offerId, wallet);
      if (!result.result) throw new Error("Failed to delete offer");
    } catch (err) {
      console.log("Error deleting offer");
    }
  };

  return (
    <Card className="cetus-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">{profile?.name || "Unknown"}</CardTitle>
            <p className="text-sm text-muted-foreground break-all">{offer.owner}</p>
          </div>
          <Badge
            variant="outline"
            className="bg-cetus-primary/10 text-cetus-primary border-cetus-primary/30"
          >
            SUI Offer
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-lg font-semibold">
              {offer.currencyCode} {offer.price.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-lg font-semibold">{offer.lockedAmount} SUI</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Escrows</p>
            <p className="text-base">{offer.activeEscrows}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-cetus-dark border-cetus-border"
            >
              {paymentMethodIcons[offer.paymentType] || <Wallet className="h-4 w-4" />}
              <span className="text-xs">{offer.paymentType}</span>
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col pt-2">
        <div className="flex flex-col md:flex-row gap-2 w-full">
          <Input
            className="border-2 bg-cetus-dark border-cetus-border py-5 rounded-2xl flex-1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            type="number"
            placeholder="Enter SUI amount"
          />
          <Button
            className="md:w-32 bg-gradient-to-r from-cetus-primary to-cetus-accent text-cetus-darker hover:opacity-90"
            onClick={handleTrade}
            disabled={loading}
          >
            {loading ? "Processing..." : "Trade"}
          </Button>
        </div>
        <div className="flex gap-5 items-center mt-2 w-full">
          <p className="text-sm text-muted-foreground">You will pay: </p>
          <p className="text-lg font-semibold">
            {offer.currencyCode} {fiatAmount.toLocaleString()}
          </p>
        </div>
        {offer.owner === wallet.account?.address && offer.activeEscrows === 0 && (
          <Button
            variant="destructive"
            onClick={() => handleDeleteOffer(offer.id)}
            className="mt-2"
          >
            Delete Offer
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}