"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AlertCircle, Bot, Shield } from "lucide-react"

type Trade = {
  id: string
  type: "buy" | "sell"
}

type AIDisputeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade: Trade | null
  onResolve: (data: { type: string; reason: string }) => void
}

export function AIDisputeDialog({ open, onOpenChange, trade, onResolve }: AIDisputeDialogProps) {
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeType, setDisputeType] = useState("payment_not_received")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    onResolve({
      type: disputeType,
      reason: disputeReason,
    })

    setIsSubmitting(false)
    onOpenChange(false)

    setDisputeReason("")
    setDisputeType("payment_not_received")
  }

  if (!trade) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Open Dispute
            </DialogTitle>
            <DialogDescription>
              Our AI agent will help resolve your dispute. Please provide details about the issue.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Dispute Type</Label>
              <RadioGroup value={disputeType} onValueChange={setDisputeType} className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="payment_not_received" id="payment_not_received" />
                  <Label htmlFor="payment_not_received" className="font-normal">
                    {trade.type === "buy"
                      ? "I made the payment but the seller hasn't released the crypto"
                      : "I haven't received the payment from the buyer"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wrong_amount" id="wrong_amount" />
                  <Label htmlFor="wrong_amount" className="font-normal">
                    {trade.type === "buy"
                      ? "I received the wrong amount of crypto"
                      : "I received the wrong amount of payment"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scam" id="scam" />
                  <Label htmlFor="scam" className="font-normal">
                    I believe this is a scam
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal">
                    Other issue
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disputeReason">Dispute Details</Label>
              <Textarea
                id="disputeReason"
                placeholder="Please provide details about your dispute..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-md bg-blue-950/30 border border-blue-900/50">
              <Bot className="h-5 w-5 text-neon-blue mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-neon-blue">AI Dispute Resolution</p>
                <p className="text-xs text-gray-400">
                  Our AI agent will analyze the trade details, chat history, and blockchain data to help resolve this
                  dispute fairly.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-500 hover:bg-red-600" disabled={!disputeReason || isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Open Dispute
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
