"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Copy, ExternalLink, Shield } from "lucide-react"
import { Trade } from "@/types/trade.types"

interface TradeDetailsTabProps {
  trade: Trade
  timeLeft: number
  onConfirmPayment: () => void
  onOpenDispute: () => void
}

export function TradeDetailsTab({ trade, timeLeft, onConfirmPayment, onOpenDispute }: TradeDetailsTabProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    const secs = Math.floor((minutes * 60) % 60)

    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="web3-card">
        <CardHeader>
          <CardTitle>Trade Information</CardTitle>
          <CardDescription>Details about this {trade.type === "buy" ? "purchase" : "sale"} of SUI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="text-lg font-semibold">{trade.type === "buy" ? "Buy" : "Sell"} SUI</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div>
                {trade.status === "pending" && (
                  <div className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 px-2 py-1 rounded-md text-sm border inline-block">
                    Awaiting Payment
                  </div>
                )}
                {trade.status === "completed" && (
                  <div className="bg-blue-500/10 text-blue-500 border-blue-500/30 px-2 py-1 rounded-md text-sm border inline-block">
                    Payment Confirmed
                  </div>
                )}
                {trade.status === "completed" && (
                  <div className="bg-green-500/10 text-green-500 border-green-500/30 px-2 py-1 rounded-md text-sm border inline-block">
                    Completed
                  </div>
                )}
                {trade.status === "dispute" && (
                  <div className="bg-red-500/10 text-red-500 border-red-500/30 px-2 py-1 rounded-md text-sm border inline-block">
                    Disputed
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-lg font-semibold">${trade.price.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-lg font-semibold">{trade.amount.toLocaleString()} SUI</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">${trade.fiatAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="text-lg font-semibold">{trade.paymentMethod}</p>
            </div>
          </div>

          {trade.status === "pending" && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p className="text-sm font-medium text-neon-blue">{formatTime(timeLeft)}</p>
              </div>
              <Progress value={(timeLeft / Number(trade.createdAt)) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {trade.status === "pending" && trade.type === "buy" && (
            <Button className="w-full bg-neon-blue hover:bg-neon-blue/90" onClick={onConfirmPayment}>
              I've Made the Payment
            </Button>
          )}

          {trade.status === "completed" && trade.type === "sell" && (
            <Button className="w-full bg-neon-purple hover:bg-neon-purple/90">Release SUI</Button>
          )}

          {trade.status === "pending" && (
            <Button
              variant="outline"
              className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-500"
              onClick={onOpenDispute}
            >
              Open Dispute
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="web3-card">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            {trade.type === "buy" ? "Send payment to these details" : "You will receive payment to these details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <div className="flex items-center justify-between rounded-md border p-3">
              <p>{trade.paymentMethod}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Account Number</Label>
            <div className="flex items-center justify-between rounded-md border p-3">
              <p>{trade.paymentMethod}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Account Name</Label>
            <div className="flex items-center justify-between rounded-md border p-3">
              <p>{trade.merchant.name}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label>Escrow Contract</Label>
            <div className="flex items-center justify-between rounded-md border p-3">
              <p className="text-xs truncate">{trade.id}</p>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <Shield className="inline h-3 w-3 mr-1" />
              Funds are secured in a Sui smart contract escrow
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

