"use client"

import React, { useState, FormEvent, Dispatch, SetStateAction } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  MessageSquare,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MockTrade } from "@/types/trade.types"

type SenderType = "user" | "system" | "merchant"

interface Disputecontent {
  decision: string
  recommended_action: string
  confidence: number
  human_intervention_needed: boolean
  reasoning: string
}

type DisputeContent = {
  [key: string]: any;
};

type Message = 
  | {
      id: string;
      sender: "user" | "merchant" | "system";
      content: string;
      timestamp: string;
    }
  | {
      id: string;
      sender: "system";
      disputecontent: string;
      timestamp: string;
      type: string;
      content: string;  // or whatever the type of parsedResponse is
    };

type TradeChatTabProps = {
  trade: MockTrade
  setTrade: Dispatch<SetStateAction<MockTrade | null>>
}

export function TradeChatTab({ trade, setTrade }: TradeChatTabProps) {
  const [newMessage, setNewMessage] = useState<string>("")
  const [isResolving, setIsResolving] = useState<boolean>(false)
  const [evidence, setEvidence] = useState<string>("")
  const [showEvidenceInput, setShowEvidenceInput] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const updatedTrade: MockTrade = {
      ...trade,
      messages: [
        ...trade.messages,
        {
          id: `${Date.now()}`,
          sender: "user",
          content: newMessage,
          timestamp: new Date().toISOString(),
        },
      ],
    }

    setTrade(updatedTrade)
    setNewMessage("")
  }

  const handleDisputeResolution = async () => {
    setIsResolving(true)
    setError(null)

    try {
      const chatLogs = trade.messages
        .filter((msg) => msg.content !== "system_dispute_resolution")
        .map((msg) => `${msg.sender}: ${msg.content}`)
        .join("\n")

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `
You are an expert in peer-to-peer trade dispute resolution. Your task is to analyze chat logs between a buyer and a seller to determine who is at fault in a dispute.

**Input:**
- Chat logs: ${chatLogs}
- Additional evidence: ${evidence || "None provided"}

**Output:**
- Decision: [buyer_at_fault | seller_at_fault | both_at_fault | no_fault]
- Recommended action: [refund | partial_refund | release_funds | hold]
- Confidence: [0-100]
- Human intervention needed: [true | false]

Please provide your analysis in JSON format with the following structure:
{
  "decision": "buyer_at_fault | seller_at_fault | both_at_fault | no_fault",
  "recommended_action": "refund | partial_refund | release_funds | hold",
  "confidence": 0-100,
  "human_intervention_needed": true | false,
  "reasoning": "detailed explanation of your decision"
}
                `,
                },
              ],
            },
          ],
        }
      )

      const aiResponse = response.data.candidates[0].content.parts[0].text as string
      const jsonMatch =
        aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
        aiResponse.match(/{[\s\S]*?}/)

      let parsedResponse: Disputecontent
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
        } catch {
          const decision =
            aiResponse.match(/decision["\s:]+([^"\s,}]+)/i)?.[1] || "no_fault"
          const recommended_action =
            aiResponse.match(/recommended_action["\s:]+([^"\s,}]+)/i)?.[1] ||
            "hold"
          const confidence = parseInt(
            aiResponse.match(/confidence["\s:]+(\d+)/i)?.[1] || "0",
            10
          )
          const human_intervention_needed =
            aiResponse.match(
              /human_intervention_needed["\s:]+(true|false)/i
            )?.[1] === "true"
          const reasoning =
            aiResponse
              .match(/reasoning["\s:]+([^}]+)/i)?.[1]
              .trim()
              .replace(/^"|"$/g, "") || "Could not extract reasoning"

          parsedResponse = {
            decision,
            recommended_action,
            confidence: isNaN(confidence) ? 0 : confidence,
            human_intervention_needed,
            reasoning,
          }
        }
      } else {
        parsedResponse = {
          decision: "no_fault",
          recommended_action: "hold",
          confidence: 0,
          human_intervention_needed: true,
          reasoning: "Could not parse AI response",
        }
      }

      const updatedTrade: MockTrade = {
        ...trade,
        messages: [
          ...trade.messages,
          {
            id: `dispute-${Date.now()}`,
            sender: "system",
            content: "AI Dispute Resolution Analysis Complete",
            timestamp: new Date().toISOString(),
          },
        ],
      }

      setTrade(updatedTrade)
      setShowEvidenceInput(false)
      setEvidence("")
    } catch (err) {
      console.error("Error resolving dispute:", err)
      setError("Failed to analyze dispute. Please try again or contact support.")
    } finally {
      setIsResolving(false)
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "buyer_at_fault":
      case "seller_at_fault":
        return "text-red-500"
      case "both_at_fault":
        return "text-yellow-500"
      case "no_fault":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "refund":
        return "bg-red-500"
      case "partial_refund":
        return "bg-yellow-500"
      case "release_funds":
        return "bg-green-500"
      case "hold":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-500"
    if (confidence >= 50) return "text-yellow-500"
    return "text-red-500"
  }

  const formatText = (text: string) =>
    text
      .split("_")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ")

  return (
    <Card className="web3-card">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Trade Chat</CardTitle>
          <CardDescription>Communicate with your trading partner</CardDescription>
        </div>
        <Button
          variant="outline"
          className="border-red-500 text-red-500 hover:bg-red-500/10"
          onClick={() => setShowEvidenceInput((f) => !f)}
        >
          <Shield className="h-4 w-4 mr-2" />
          Dispute
        </Button>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="p-3 mb-3 border border-red-500/30 rounded-md bg-red-500/10 text-red-500 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {trade.messages.map((msg) => (
            <div key={msg.id} className="flex flex-col space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                {msg.sender === "system" ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                <span>{msg.sender}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-sm">{msg.content}</div>

              {msg.content && (
                <div className="mt-2 p-2 border rounded-md bg-gray-50">
                  <div className={`font-bold ${getDecisionColor(msg.content)}`}>
                    Decision: {formatText(msg.content)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getActionColor(msg.content)} text-white`}>
                      {formatText(msg.content)}
                    </Badge>
                    <span className={`text-sm ${getConfidenceColor(Number(msg.timestamp))}`}>
                      Confidence: {msg.content}%
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    Reasoning: {msg.content}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Human Intervention Needed: {msg.content ? "Yes" : "No"}
                  </p>
                </div>
              )}
            </div>
          ))}

          {showEvidenceInput && (
            <div className="space-y-2">
              <Input
                placeholder="Add any relevant evidence (optional)"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
              <Button onClick={handleDisputeResolution} disabled={isResolving}>
                {isResolving ? "Analyzing..." : "Submit Dispute for AI Resolution"}
              </Button>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 mt-4"
          >
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button type="submit">Send</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
