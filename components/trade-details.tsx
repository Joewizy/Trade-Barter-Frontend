"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { TradeChatTab } from "./trade-chat-tab"
import { TradeDetailsTab } from "./trade-details-tab"
import { AIDisputeDialog } from "./ai-dispute-dialog"
import { useMockTrade } from "@/hooks/use-mock-trade"
import { MockTrade } from "@/types/trade.types"

export function TradeDetails({ id }: { id: string }) {
  const { trade, loading, setTrade } = useMockTrade(id)
  const [activeTab, setActiveTab] = useState("details")
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    if (!trade || trade.status !== "pending") return

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1 / 60))
    }, 1000)

    return () => clearInterval(timer)
  }, [trade])

  useEffect(() => {
    if (trade?.createdAt) {
      setTimeLeft(0)
    }
  }, [trade])

  const handleConfirmPayment = () => {
    if (!trade) return

    const updatedTrade: MockTrade = {
      ...trade,
      status: "completed",
      messages: [
        ...trade.messages,
        {
          id: `${trade.messages.length + 1}`,
          sender: "user",
          content: "I have made the payment.",
          timestamp: new Date().toISOString(),
        },
        {
          id: `${trade.messages.length + 2}`,
          sender: "system",
          content: "Payment confirmed. Waiting for merchant to release SUI.",
          timestamp: new Date().toISOString(),
        },
      ],
    }

    setTrade(updatedTrade)
  }

  const handleOpenDispute = () => {
    setIsDisputeDialogOpen(true)
  }

  const getStatusBadge = () => {
    switch (trade?.status) {
      case "pending":
        return (
          <div className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 px-2 py-1 rounded-md text-sm border">
            Awaiting Payment
          </div>
        )
      case "completed":
        return (
          <div className="bg-green-500/10 text-green-500 border-green-500/30 px-2 py-1 rounded-md text-sm border">
            Completed
          </div>
        )
      case "dispute":
        return (
          <div className="bg-red-500/10 text-red-500 border-red-500/30 px-2 py-1 rounded-md text-sm border">
            Disputed
          </div>
        )
      default:
        return <div className="px-2 py-1 rounded-md text-sm border">Unknown</div>
    }
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
        </div>
      </div>
    )
  }

  if (!trade) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight neon-text">
              {trade.type === "buy" ? "Buy" : "Sell"} SUI Trade
            </h1>
            {getStatusBadge()}
          </div>
          <p className="text-muted-foreground">
            Trade ID: {trade.id} • Created {new Date(trade.createdAt).toLocaleString()}
          </p>
        </div>

        <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="details"
              className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue"
            >
              Trade Details
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple"
            >
              Chat ({trade.messages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <TradeChatTab trade={trade} setTrade={setTrade} />
          </TabsContent>
        </Tabs>
      </div>

      <AIDisputeDialog
        open={isDisputeDialogOpen}
        onOpenChange={setIsDisputeDialogOpen}
        trade={trade}
        onResolve={(resolution) => {
          const updatedTrade: MockTrade = {
            ...trade,
            status: "dispute",
            messages: [
              ...trade.messages,
              {
                id: `${trade.messages.length + 1}`,
                sender: "system",
                content: `Dispute opened: ${resolution.reason}`,
                timestamp: new Date().toISOString(),
              },
              {
                id: `${trade.messages.length + 2}`,
                sender: "system",
                content: "AI Agent has been assigned to this dispute.",
                timestamp: new Date().toISOString(),
              },
            ],
          }

          setTrade(updatedTrade)
        }}
      />
    </div>
  )
}
