"use client"

import type React from "react"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, Clock, MessageSquare, Shield, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  type?: string
  result?: DisputeResult
}

interface DisputeResult {
  decision: string
  recommended_action: string
  confidence: number
  human_intervention_needed: boolean
  reasoning: string
}

interface Trade {
  messages: Message[]
}

interface TradeChatTabProps {
  trade: Trade
  setTrade: (trade: Trade) => void
}

export function TradeChatTab({ trade, setTrade }: TradeChatTabProps) {
  const [newMessage, setNewMessage] = useState<string>("")
  const [isResolving, setIsResolving] = useState<boolean>(false)
  const [evidence, setEvidence] = useState<string>("")
  const [showEvidenceInput, setShowEvidenceInput] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const updatedTrade = {
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
      // Prepare chat logs for AI analysis
      const chatLogs = trade.messages
        .filter((msg) => msg.type !== "system_dispute_resolution")
        .map((msg) => `${msg.sender}: ${msg.content}`)
        .join("\n")

      // Call Gemini API directly from client
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

**Guidelines:**
1. **Determine Fault:**
- Did the seller deliver the goods or services as promised? Check for delivery confirmations or promises made in the chat.
- Did the buyer pay the agreed amount? Verify payment evidence like transaction hashes.
- Identify breaches of agreement, miscommunications, or unmet expectations.

2. **Assess Evidence:**
- Evaluate the credibility of evidence (e.g., is the transaction hash valid, does the tracking number show delivery?).
- Check timestamps and consistency in the chat logs (e.g., did someone change their story?).

3. **Confidence Level:**
- High confidence (80-100): Clear, consistent evidence supports the decision.
- Medium confidence (50-79): Some evidence exists, but there are minor gaps or ambiguities.
- Low confidence (0-49): Evidence is conflicting, missing, or insufficient.

4. **Human Intervention:**
- Flag as "true" if confidence is below 70 or if the dispute involves complex legal, ethical, or unclear issues (e.g., fraud allegations, missing evidence).

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
        },
      )

      // Extract the AI's response
      const aiResponse = response.data.candidates[0].content.parts[0].text

      // Parse the JSON from the AI's response
      // The AI might return the JSON with markdown formatting, so we need to extract it
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/{[\s\S]*?}/)

      let parsedResponse
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
        } catch (e) {
          // If parsing fails, try to extract the JSON manually
          const decision = aiResponse.match(/decision["\s:]+([^"\s,}]+)/i)?.[1]
          const action = aiResponse.match(/recommended_action["\s:]+([^"\s,}]+)/i)?.[1]
          const confidence = Number.parseInt(aiResponse.match(/confidence["\s:]+(\d+)/i)?.[1] || "0")
          const humanNeeded = aiResponse.match(/human_intervention_needed["\s:]+(\w+)/i)?.[1] === "true"
          const reasoning = aiResponse
            .match(/reasoning["\s:]+([^}]+)/i)?.[1]
            ?.trim()
            .replace(/^"|"$/g, "")

          parsedResponse = {
            decision: decision || "no_fault",
            recommended_action: action || "hold",
            confidence: isNaN(confidence) ? 0 : confidence,
            human_intervention_needed: humanNeeded || true,
            reasoning: reasoning || "Could not extract reasoning",
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

      // Add the AI's response as a system message
      const updatedTrade = {
        ...trade,
        messages: [
          ...trade.messages,
          {
            id: `dispute-${Date.now()}`,
            sender: "system",
            content: "AI Dispute Resolution Analysis Complete",
            timestamp: new Date().toISOString(),
            type: "system_dispute_resolution",
            result: parsedResponse,
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
        return "text-red-500"
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

  const formatDecision = (decision: string) => {
    return decision
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <Card className="web3-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Trade Chat</CardTitle>
          <CardDescription>Communicate with your trading partner</CardDescription>
        </div>
        <Button
          onClick={() => setShowEvidenceInput(!showEvidenceInput)}
          variant="outline"
          className="border-red-500 text-red-500 hover:bg-red-500/10"
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
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          {showEvidenceInput && (
            <div className="space-y-2 p-3 border border-yellow-500/30 rounded-md bg-yellow-500/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium">Dispute Resolution</h4>
              </div>
              <p className="text-sm text-gray-400">
                Provide any additional evidence (transaction hashes, tracking numbers, etc.) to help the AI resolve your
                dispute.
              </p>
              <Input
                placeholder="Enter additional evidence here..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="mt-2"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={handleDisputeResolution}
                  disabled={isResolving}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  {isResolving ? "Analyzing..." : "Resolve Dispute"}
                </Button>
                <Button variant="outline" onClick={() => setShowEvidenceInput(false)} disabled={isResolving}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="h-[400px] overflow-y-auto space-y-4 p-4 border rounded-md">
            {trade.messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                {message.type === "system_dispute_resolution" && message.result ? (
                  <div className="w-full p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-bold text-lg">AI Dispute Resolution</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Decision:</p>
                        <p className={`font-medium ${getDecisionColor(message.result.decision)}`}>
                          {formatDecision(message.result.decision)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Recommended Action:</p>
                        <Badge className={`${getActionColor(message.result.recommended_action)} text-white`}>
                          {formatAction(message.result.recommended_action)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Confidence:</p>
                        <p className={`font-medium ${getConfidenceColor(message.result.confidence)}`}>
                          {message.result.confidence}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Human Review:</p>
                        <p className={message.result.human_intervention_needed ? "text-red-500" : "text-green-500"}>
                          {message.result.human_intervention_needed ? "Recommended" : "Not needed"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-400">Reasoning:</p>
                      <p className="text-sm mt-1 p-2 bg-gray-800/50 rounded">{message.result.reasoning}</p>
                    </div>

                    {message.result.human_intervention_needed && (
                      <Button
                        className="w-full bg-red-500 hover:bg-red-600"
                        onClick={() => {
                          // Add a system message indicating human escalation
                          const updatedTrade = {
                            ...trade,
                            messages: [
                              ...trade.messages,
                              {
                                id: `human-escalation-${Date.now()}`,
                                sender: "system",
                                content:
                                  "This dispute has been escalated to a human moderator. A team member will review your case shortly.",
                                timestamp: new Date().toISOString(),
                              },
                            ],
                          }
                          setTrade(updatedTrade)
                        }}
                      >
                        Escalate to Human Moderator
                      </Button>
                    )}
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-blue-500/20 text-white"
                        : message.sender === "system"
                          ? "bg-gray-800/50 text-gray-300 italic"
                          : "bg-purple-500/20 text-white"
                    }`}
                  >
                    {message.sender === "system" && <Clock className="inline h-3 w-3 mr-1" />}
                    <p>{message.content}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

