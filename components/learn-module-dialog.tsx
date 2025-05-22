"use client"

import { useState, Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, BookOpen, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { ModuleContentStep } from "@/components/module-content-step"
import { ModuleReward } from "@/components/module-reward"
import { NFTReward } from "@/types/trade.types"

type Module = {
  title: string
  duration: string
  difficulty: string
  completed?: boolean
  progress?: number
  nftReward: NFTReward
}

type LearnModuleDialogProps = {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>> | ((open: boolean) => void)
  module: Module | null
}

export function LearnModuleDialog({ open, onOpenChange, module }: LearnModuleDialogProps) {
  const [activeTab, setActiveTab] = useState("content")
  const [currentStep, setCurrentStep] = useState(1)
  const [isCompleted, setIsCompleted] = useState(module?.completed || false)
  const [progress, setProgress] = useState(module?.progress || 0)

  const totalSteps = 5

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      const newProgress = Math.min(100, Math.round((nextStep / totalSteps) * 100))
      setProgress(newProgress)
    } else {
      setIsCompleted(true)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!module) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{module.title}</DialogTitle>
          <DialogDescription>
            {module.duration} • {module.difficulty}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger
              value="reward"
              className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple"
            >
              <Award className="h-4 w-4 mr-2" />
              NFT Reward
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6 space-y-6">
            {!isCompleted ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Step {currentStep} of {totalSteps}
                    </span>
                    {progress === 100 && <span className="text-green-500">Ready to complete!</span>}
                  </div>
                </div>

                <div className="min-h-[300px]">
                  <ModuleContentStep step={currentStep} module={module} />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <Button
                    className={
                      currentStep === totalSteps && progress === 100
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-neon-blue hover:bg-neon-blue/90"
                    }
                    onClick={handleNextStep}
                  >
                    {currentStep === totalSteps && progress === 100 ? (
                      <>
                        Complete Module
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Module Completed!</h3>
                  <p className="text-muted-foreground">
                    Congratulations! You have successfully completed the {module.title} module.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-neon-purple font-medium">You've earned:</p>
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-lg overflow-hidden glow-border">
                      <img
                        src={module.nftReward.image || "/placeholder.svg"}
                        alt={module.nftReward.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-neon-purple">{module.nftReward.name} NFT</p>
                </div>
                <Button
                  className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/90 hover:to-neon-purple/90"
                  onClick={() => setActiveTab("reward")}
                >
                  View NFT Reward
                  <Award className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reward" className="mt-6">
            <ModuleReward module={module} isCompleted={isCompleted} onViewContent={() => setActiveTab("content")} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
