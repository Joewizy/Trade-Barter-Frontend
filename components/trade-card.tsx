"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { confirmPayment } from "@/lib/calls";
import { useWallet } from "@suiet/wallet-kit";

export function TradeCard({ trade, getStatusIcon, getStatusBadge, userAddress }: {
  trade: any;
  getStatusIcon: (status: string) => JSX.Element | null;
  getStatusBadge: (status: string) => JSX.Element;
  userAddress: string;
}) {
  const wallet = useWallet();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isSeller = userAddress === trade.seller.address;
  const counterparty = isSeller ? trade.buyer : trade.seller;
  const currencySymbol = trade.currency === 'NGN' ? '₦' : '$';

  const handleConfirmPayment = async () => {
    if (!wallet) return;
    setIsConfirming(true);
    setError(null);
    
    try {
      const result = await confirmPayment(trade.id, trade.offerId, wallet);
      if (!result.result) throw new Error('Payment confirmation failed');
      // Optionally trigger data refresh here
    } catch (err: any) {
      setError(err.message || 'Failed to confirm payment');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Card className="web3-card overflow-hidden hover:border-neon-blue/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">{getStatusIcon(trade.status)}</div>
            <div>
              <CardTitle className="text-lg font-medium">
                {isSeller ? 'Selling' : 'Buying'} {trade.amount.toLocaleString()} SUI
                <span className="text-neon-blue block sm:inline"> with {counterparty.profile.name}</span>
              </CardTitle>
              <CardDescription className="mt-1 flex flex-col">
                <span>{new Date(trade.createdAt).toLocaleDateString()}</span>
                <span className="text-xs text-muted-foreground/80">
                  {counterparty.profile.name}'s Address: {counterparty.shortAddress}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="sm:mt-0 mt-2">{getStatusBadge(trade.status)}</div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Unit Price</p>
            <p className="text-lg font-semibold">
              {currencySymbol}{trade.price.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-lg font-semibold">
              {currencySymbol}{(trade.fiatAmount / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="text-lg font-semibold capitalize">
              {trade.paymentMethod.replace('-', ' ')}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        {isSeller && trade.status === 'pending' ? (
          <div className="w-full space-y-2">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleConfirmPayment}
              disabled={isConfirming}
            >
              {isConfirming ? 'Confirming...' : 'Confirm Payment'}
            </Button>
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
        ) : (
          <div className="w-full text-center text-muted-foreground text-sm">
            {!isSeller && "Awaiting seller confirmation"}
            {isSeller && trade.status !== 'pending' && "Transaction completed"}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}