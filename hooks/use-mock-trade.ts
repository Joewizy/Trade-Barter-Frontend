import { useState, useEffect } from "react"
import { MockTrade } from "@/types/trade.types"

export function useMockTrade(id: string) {
  const [trade, setTrade] = useState<MockTrade | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // simulate fetching
    const fakeTrade: MockTrade = {
      id,
      type: "buy",
      price: 0.45,
      currency: "USD",
      crypto: "SUI",
      amount: 100,
      fiatAmount: 45,
      paymentMethod: "Bank Transfer",
      merchant: { name: "Jane Doe" },
      createdAt: new Date().toISOString(),
      status: "pending",
      messages: [],
    }

    setTimeout(() => {
      setTrade(fakeTrade)
      setLoading(false)
    }, 1000)
  }, [id])

  return { trade, setTrade, loading }
}
