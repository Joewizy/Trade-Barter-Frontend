"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradeCard } from "@/components/trade-card";
import { Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { getAllEscrows, getAllEscrowsWithDetails } from "@/lib/calls";
import { Trade } from "@/types/trade.types";
import { useWallet } from "@suiet/wallet-kit";

export function TradesList() {
  const [activeTab, setActiveTab] = useState("all");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useWallet();

  useEffect(() => {
    async function fetchTrades() {
      if (!address) return;

      setLoading(true);
      try {
        const tradesData = await getAllEscrowsWithDetails(address);
        console.log(`${address} escrows, ${tradesData}`)
        const sorted = tradesData.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTrades(sorted);
      } catch (error) {
        console.error("Failed to fetch trades:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrades();
  }, [address]);

  const filteredTrades = trades.filter((trade) => {
    switch (activeTab) {
      case "active": return trade.status === "pending";
      case "completed": return trade.status === "completed";
      case "disputed": return trade.status === "dispute";
      default: return true;
    }
  });

  const getStatusIcon = (status: string) => {
    const iconConfig = {
      pending: { icon: Clock, color: "text-yellow-500" },
      completed: { icon: CheckCircle, color: "text-green-500" },
      dispute: { icon: AlertCircle, color: "text-red-500" },
      cancelled: { icon: XCircle, color: "text-gray-500" }
    };
    const { icon: Icon, color } = iconConfig[status as keyof typeof iconConfig] || {};
    return Icon ? <Icon className={`h-5 w-5 ${color}`} /> : null;
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "px-2 py-1 rounded-md text-sm border inline-flex items-center gap-1";
    const statusConfig = {
      pending: { text: "Awaiting Payment", class: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" },
      completed: { text: "Completed", class: "bg-green-500/10 text-green-500 border-green-500/30" },
      dispute: { text: "Disputed", class: "bg-red-500/10 text-red-500 border-red-500/30" },
      cancelled: { text: "Cancelled", class: "bg-gray-500/10 text-gray-500 border-gray-500/30" }
    };
    const { text, class: statusClass } = statusConfig[status as keyof typeof statusConfig] || {};
    return <div className={`${baseClass} ${statusClass}`}>{text}</div>;
  };

  if (loading || !address) {
    return (
      <div className="container py-8">
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col space-y-4">
            <div className="h-8 w-48 bg-slate-800/50 rounded-md animate-pulse" />
            <div className="h-4 w-96 bg-slate-800/50 rounded-md animate-pulse" />
          </div>
          <div className="h-12 w-full bg-slate-800/50 rounded-md animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full bg-slate-800/50 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight neon-text">My Trades</h1>
          <p className="text-muted-foreground">View and manage all your P2P trades</p>
        </div>

        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Trades</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="disputed">Disputed</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {["all", "active", "completed", "disputed"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <TabContentPanel
                  trades={filteredTrades}
                  emptyText={`No ${tab === "all" ? "" : tab} trades found.`}
                  getStatusIcon={getStatusIcon}
                  getStatusBadge={getStatusBadge}
                  userAddress={address}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function TabContentPanel({ trades, emptyText, getStatusIcon, getStatusBadge, userAddress }: {
  trades: Trade[];
  emptyText: string;
  getStatusIcon: (status: string) => JSX.Element | null;
  getStatusBadge: (status: string) => JSX.Element;
  userAddress: string;
}) {
  return (
    <div className="grid gap-4">
      {trades.length > 0 ? (
        trades.map((trade) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            getStatusIcon={getStatusIcon}
            getStatusBadge={getStatusBadge}
            userAddress={userAddress}
          />
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyText}</p>
        </div>
      )}
    </div>
  );
}