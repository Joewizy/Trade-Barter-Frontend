"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Award } from "lucide-react"
import { LearnModuleDialog } from "@/components/learn-module-dialog"
import { LearningModuleCard } from "@/components/learning-module-card"
import { NFTRewardCard } from "@/components/nft-reward-card"
import { NFTReward, LearningModule } from "@/types/trade.types"

// Mock data for learning modules
const mockModules = [
  {
    id: "1",
    title: "Introduction to Web3",
    description: "Learn the basics of Web3, blockchain technology, and decentralized applications.",
    duration: "15 min",
    difficulty: "Beginner",
    progress: 100,
    completed: true,
    nftReward: {
      name: "Web3 Pioneer",
      image: "/placeholder.svg?height=200&width=200",
    },
  },
  {
    id: "2",
    title: "Understanding Sui Blockchain",
    description: "Explore the Sui blockchain architecture, Move programming language, and key features.",
    duration: "25 min",
    difficulty: "Intermediate",
    progress: 60,
    completed: false,
    nftReward: {
      name: "Sui Explorer",
      image: "/placeholder.svg?height=200&width=200",
    },
  },
  {
    id: "3",
    title: "P2P Trading Fundamentals",
    description: "Master the essentials of peer-to-peer trading, escrow systems, and dispute resolution.",
    duration: "20 min",
    difficulty: "Intermediate",
    progress: 30,
    completed: false,
    nftReward: {
      name: "P2P Master",
      image: "/placeholder.svg?height=200&width=200",
    },
  },
  {
    id: "4",
    title: "Smart Contracts & DeFi",
    description: "Dive into smart contracts, decentralized finance, and their applications in the Sui ecosystem.",
    duration: "30 min",
    difficulty: "Advanced",
    progress: 0,
    completed: false,
    locked: true,
    nftReward: {
      name: "DeFi Wizard",
      image: "/placeholder.svg?height=200&width=200",
    },
  },
  {
    id: "5",
    title: "Security Best Practices",
    description: "Learn essential security practices for protecting your assets and trading safely.",
    duration: "25 min",
    difficulty: "Intermediate",
    progress: 0,
    completed: false,
    locked: true,
    nftReward: {
      name: "Security Guardian",
      image: "/placeholder.svg?height=200&width=200",
    },
  },
]

// Mock data for NFT rewards
const mockNFTs = [
  {
    id: "1",
    name: "Web3 Pioneer",
    description: "Awarded for completing the Introduction to Web3 module",
    image: "/placeholder.svg?height=200&width=200",
    acquired: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
  {
    id: "2",
    name: "Sui Explorer",
    description: "Awarded for completing the Understanding Sui Blockchain module",
    image: "/placeholder.svg?height=200&width=200",
    acquired: false,
  },
  {
    id: "3",
    name: "P2P Master",
    description: "Awarded for completing the P2P Trading Fundamentals module",
    image: "/placeholder.svg?height=200&width=200",
    acquired: false,
  },
  {
    id: "4",
    name: "DeFi Wizard",
    description: "Awarded for completing the Smart Contracts & DeFi module",
    image: "/placeholder.svg?height=200&width=200",
    acquired: false,
  },
  {
    id: "5",
    name: "Security Guardian",
    description: "Awarded for completing the Security Best Practices module",
    image: "/placeholder.svg?height=200&width=200",
    acquired: false,
  },
]

export function LearnContent() {
  const [activeTab, setActiveTab] = useState("modules")
  const [selectedModule, setSelectedModule] = useState(null)
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
  const [modules, setModules] = useState<LearningModule[]>([])
  const [nfts, setNfts] = useState<NFTReward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setModules(mockModules)
      setNfts(mockNFTs)
      setLoading(false)
    }, 500)
  }, [])

  const handleOpenModule = (module: any) => {
    setSelectedModule(module)
    setIsModuleDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col space-y-4">
            <div className="h-8 w-48 bg-slate-800/50 rounded-md animate-pulse"></div>
            <div className="h-4 w-96 bg-slate-800/50 rounded-md animate-pulse"></div>
          </div>
          <div className="h-12 w-full bg-slate-800/50 rounded-md animate-pulse"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 w-full bg-slate-800/50 rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight neon-text">Learn & Earn</h1>
          <p className="text-muted-foreground">Expand your knowledge about Web3 and earn exclusive NFT rewards</p>
        </div>

        <Tabs defaultValue="modules" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="modules"
              className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Learning Modules
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple"
            >
              <Award className="h-4 w-4 mr-2" />
              NFT Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <LearningModuleCard key={module.id} module={module} onOpenModule={handleOpenModule} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {nfts.map((nft) => (
                <NFTRewardCard key={nft.id} nft={nft} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedModule && (
        <LearnModuleDialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen} module={selectedModule} />
      )}
    </div>
  )
}

export default LearnContent

