"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import {
  confirmPayment,
  cancelEscrow,
  makeDispute,
  resolveDispute,
  forceCompleteTrade,
  refundSeller,
} from "@/lib/calls";
import { useWallet } from "@suiet/wallet-kit";
import { toast, useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function TradeCard({
  trade,
  getStatusIcon,
  getStatusBadge,
  userAddress,
}: {
  trade: any;
  getStatusIcon: (status: string) => JSX.Element | null;
  getStatusBadge: (status: string) => JSX.Element;
  userAddress?: string;
}) {
  const mist = 1e9;
  const wallet = useWallet();
  const router = useRouter();
  const { toast } = useToast()

  const [isConfirming, setIsConfirming] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isSeller = userAddress === trade.seller.address;
  const counterparty = isSeller ? trade.buyer : trade.seller;
  const currencySymbol = trade.currency === "NGN" ? "₦" : "$";
  const adminAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS;
  console.log(trade)

  const handleConfirmPayment = async () => {
    if (!wallet) return;

    setIsConfirming(true);
    setError(null);

    try {
      const result = await confirmPayment(trade.id, trade.offerId, wallet);

      if (result.result) {
        toast({
          title: "Success",
          description: "Payment confirmed successfully!",
        });

        setTimeout(() => {
          router.push("/trades?tab=completed");
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: "Could not confirm payment",
          description: result.result || "Could not create escrow",
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to confirm payment");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelEscrow = async () => {
    if (!wallet) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      const result = await cancelEscrow(trade.id, trade.offerId, wallet);
      if (!result.result) throw new Error("Cancel failed");

      toast({
        title: "Escrow Cancelled",
        description: "Your trade escrow was successfully cancelled.",
      });

      setTimeout(() => router.push("/trades?tab=active"), 2000);
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel escrow");
      toast({
        variant: "destructive",
        title: "Cancel Failed",
        description: err.message || "Could not cancel the escrow",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMakeDispute = async () => {
    if (!wallet) return;
    setIsDisputing(true);
    setDisputeError(null);

    try {
      const result = await makeDispute(trade.id, wallet);
      if (!result.result) throw new Error("Failed to raise dispute");

      toast({
        title: "Dispute Raised",
        description: "Trade dispute was successfully created.",
      });

      setTimeout(() => router.push("/trades?tab=dispute"), 2000);
    } catch (err: any) {
      setDisputeError(err.message || "Failed to raise dispute");
      toast({
        variant: "destructive",
        title: "Dispute Failed",
        description: err.message || "Could not raise a dispute",
      });
    } finally {
      setIsDisputing(false);
    }
  };

  const handleDisputeResolution = async () => {
    if (!wallet) return;
    if (!isSeller) {
      alert("Only Seller can resolve dispute");
      return;
    }

    setIsDisputing(true);
    setDisputeError(null);

    try {
      const result = await resolveDispute(trade.id, wallet);
      if (!result.result) throw new Error("Failed to resolve dispute");

      toast({
        title: "Dispute Resolved",
        description: "The dispute has been resolved successfully.",
      });

      setTimeout(() => router.push("/trades?tab=completed"), 2000);
    } catch (err: any) {
      setDisputeError(err.message || "Failed to resolve dispute");
      toast({
        variant: "destructive",
        title: "Resolution Failed",
        description: err.message || "Could not resolve the dispute",
      });
    } finally {
      setIsDisputing(false);
    }
  };

  const handleForceCompleteTrade = async () => {
    if (!wallet) return;
    setIsDisputing(true);
    setDisputeError(null);

    try {
      const result = await forceCompleteTrade(trade.id, trade.offerId, wallet);
      if (!result.result) throw new Error("Force complete failed");

      toast({
        title: "Trade Force Completed",
        description: "Admin has forcefully completed the trade.",
      });

      setTimeout(() => router.push("/trades?tab=completed"), 2000);
    } catch (err: any) {
      setDisputeError(err.message || "Failed to force complete trade");
      toast({
        variant: "destructive",
        title: "Force Completion Failed",
        description: err.message || "Could not force complete the trade",
      });
    } finally {
      setIsDisputing(false);
    }
  };

  const handleRefundSeller = async () => {
    if (!wallet) return;
    setIsDisputing(true);
    setDisputeError(null);

    try {
      const result = await refundSeller(trade.id, trade.offerId, wallet);
      if (!result.result) throw new Error("Refund failed");

      toast({
        title: "Seller Refunded",
        description: "The seller has been refunded successfully.",
      });

      setTimeout(() => router.push("/trades?tab=cancelled"), 2000);
    } catch (err: any) {
      setDisputeError(err.message || "Failed to refund seller");
      toast({
        variant: "destructive",
        title: "Refund Failed",
        description: err.message || "Could not refund seller",
      });
    } finally {
      setIsDisputing(false);
    }
  };

  const renderStatusMessage = () => {
    if (trade.status === "completed") {
      const suiAmount = trade.fiatAmount / (trade.price * mist);
      return isSeller
        ? `You sold ${suiAmount} SUI to ${trade.buyer.profile.name}`
        : `You bought ${suiAmount} SUI from ${trade.seller.profile.name}`;
    }
    return `${isSeller ? "Selling" : "Buying"} ${trade.amount} SUI`;
  };

  return (
    <Card className="web3-card overflow-hidden hover:border-neon-blue/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">{getStatusIcon(trade.status)}</div>
            <div>
              <CardTitle className="text-lg font-medium">
                {renderStatusMessage()}
                {trade.status !== "completed" && (
                  <span className="text-neon-blue block sm:inline">
                    {" "}with {counterparty.profile.name}
                  </span>
                )}
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
              {currencySymbol}{(trade.fiatAmount / 1e9).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="text-lg font-semibold capitalize">
              {trade.paymentMethod.replace("-", " ")}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 space-y-2 flex flex-col">
        {/* Seller: Confirm Payment */}
        {trade.status === "pending" && isSeller && (
          <>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleConfirmPayment}
              disabled={isConfirming}
            >
              {isConfirming ? "Confirming..." : "Confirm Payment"}
            </Button>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </>
        )}

        {/* Buyer: Cancel Escrow */}
        {trade.status === "pending" && !isSeller && (
          <>
            <Button
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              onClick={handleCancelEscrow}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Cancel Escrow"}
            </Button>
            {cancelError && <p className="text-red-500 text-sm text-center">{cancelError}</p>}
          </>
        )}

        {/* Raise Dispute */}
        {trade.status === "pending" && (
          <>
            <Button
              variant="outline"
              className="w-full bg-red-500 text-white hover:bg-red-700 hover:text-white"
              onClick={handleMakeDispute}
              disabled={isDisputing}
            >
              {isDisputing ? "Submitting..." : "Raise Dispute"}
            </Button>
            {disputeError && <p className="text-red-500 text-sm text-center">{disputeError}</p>}
          </>
        )}

        {/* Seller: Resolve Dispute */}
        {trade.status === "dispute" && isSeller && (
          <>
            <Button
              variant="outline"
              className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              onClick={handleDisputeResolution}
              disabled={isDisputing}
            >
              {isDisputing ? "Resolving..." : "Resolve Dispute"}
            </Button>
            {disputeError && (
              <p className="text-blue-500 text-sm text-center">{disputeError}</p>
            )}
          </>
        )}

        {/* Admin: Admin Tools */}
        {trade.status === "dispute" && userAddress === adminAddress && (
          <>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleForceCompleteTrade}
              disabled={isDisputing}
            >
              {isDisputing ? "Completing..." : "Force Complete Trade"}
            </Button>

            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={handleRefundSeller}
              disabled={isDisputing}
            >
              {isDisputing ? "Refunding..." : "Refund Seller"}
            </Button>

            {disputeError && (
              <p className="text-red-500 text-sm text-center">{disputeError}</p>
            )}
          </>
        )}

        {/* Completed message */}
        {trade.status === "completed" && (
          <p className="text-center text-muted-foreground text-sm">
            {renderStatusMessage()}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
