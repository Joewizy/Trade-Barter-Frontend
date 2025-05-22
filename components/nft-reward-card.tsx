import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckCircle, Lock } from "lucide-react"

type NFT = {
  id: string | number
  name: string
  description: string
  image?: string
  acquired: boolean
  date?: string | number | Date
}

export function NFTRewardCard({ nft }: { nft: NFT }) {
  return (
    <Card
      key={nft.id}
      className={`web3-card overflow-hidden ${!nft.acquired ? "opacity-70" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{nft.name}</CardTitle>
          {nft.acquired ? (
            <div className="bg-green-500/10 text-green-500 border-green-500/30 px-2 py-1 rounded-md text-sm border inline-flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Acquired
            </div>
          ) : (
            <div className="bg-gray-500/10 text-gray-400 border-gray-500/30 px-2 py-1 rounded-md text-sm border inline-flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </div>
          )}
        </div>
        <CardDescription>{nft.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-4">
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 rounded-lg overflow-hidden glow-border">
            <img
              src={nft.image || "/placeholder.svg"}
              alt={nft.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {nft.acquired ? (
          <div className="w-full text-center text-sm text-muted-foreground">
            Acquired on {nft.date ? new Date(nft.date).toLocaleDateString() : "Date not available"}
          </div>
        ) : (
          <div className="w-full text-center text-sm text-muted-foreground">
            Complete the corresponding learning module to earn this NFT
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
