"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Lock, ArrowRight, Gift } from "lucide-react"

type Module = {
  id: string | number
  title: string
  description: string
  duration: string
  difficulty: string
  progress: number
  completed: boolean
  locked?: boolean
  nftReward: {
    name: string
  }
}

type LearningModuleCardProps = {
  module: Module
  onOpenModule: (module: Module) => void
}

export function LearningModuleCard({ module, onOpenModule }: LearningModuleCardProps) {
  return (
    <Card key={module.id} className={`web3-card overflow-hidden ${module.locked ? "opacity-70" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">{module.title}</CardTitle>
            <CardDescription>
              {module.duration} • {module.difficulty}
            </CardDescription>
          </div>
          {module.completed ? (
            <div className="bg-green-500/10 text-green-500 border-green-500/30 px-2 py-1 rounded-md text-sm border inline-flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completed
            </div>
          ) : module.locked ? (
            <div className="bg-gray-500/10 text-gray-400 border-gray-500/30 px-2 py-1 rounded-md text-sm border inline-flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </div>
          ) : (
            <div className="bg-blue-500/10 text-blue-500 border-blue-500/30 px-2 py-1 rounded-md text-sm border">
              In Progress
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
        {!module.completed && !module.locked && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{module.progress}%</span>
            </div>
            <Progress value={module.progress} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <Gift className="h-4 w-4 text-neon-purple mr-2" />
            <span className="text-sm text-neon-purple">{module.nftReward.name} NFT</span>
          </div>
          <Button
            className={
              module.locked
                ? "bg-gray-700 hover:bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/90 hover:to-neon-purple/90"
            }
            onClick={() => !module.locked && onOpenModule(module)}
            disabled={module.locked}
          >
            {module.completed ? "Review" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
