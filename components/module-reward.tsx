'use client'

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

type ModuleType = {
  title: string
  nftReward?: {
    name: string
    image?: string
  }
}

export function ModuleReward({
  module,
  isCompleted,
  onViewContent,
}: {
  module: ModuleType
  isCompleted: boolean
  onViewContent: () => void
}) {
  if (!module) return null

  return (
    <div className="flex flex-col items-center justify-center py-4 space-y-6">
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 rounded-lg overflow-hidden glow-border">
          <img
            src={module.nftReward?.image || "/placeholder.svg"}
            alt={module.nftReward?.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">{module.nftReward?.name}</h3>
        <p className="text-muted-foreground">
          This exclusive NFT is awarded to learners who complete the {module.title} module.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="p-4 rounded-lg bg-black/40 border border-neon-purple/20">
          <h4 className="font-bold text-neon-purple mb-2">NFT Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Collection</p>
              <p>Furies Learn & Earn</p>
            </div>
            <div>
              <p className="text-muted-foreground">Rarity</p>
              <p>Uncommon</p>
            </div>
            <div>
              <p className="text-muted-foreground">Blockchain</p>
              <p>Sui</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p>{isCompleted ? "Acquired" : "Not Acquired"}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-black/40 border border-neon-blue/20">
          <h4 className="font-bold text-neon-blue mb-2">Benefits</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Reduced trading fees on the platform</li>
            <li>Access to exclusive trading events</li>
            <li>Part of the Learn & Earn NFT collection</li>
            <li>Proof of knowledge and achievement</li>
          </ul>
        </div>
      </div>

      {!isCompleted && (
        <Button
          className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/90 hover:to-neon-purple/90"
          onClick={onViewContent}
        >
          Complete Module to Earn
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  )
}
