import { CheckCircle } from "lucide-react"

export function ModuleContentStep({ step, module }: { step: number; module: { title: string; nftReward: { name: string } } }) {
  switch (step) {
    case 1:
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Introduction</h3>
          <p>
            Welcome to the {module.title} learning module. In this module, you will learn about the fundamental concepts
            and practical applications of this topic.
          </p>
          <p>
            By the end of this module, you will have a solid understanding of the key principles and be able to apply
            them in real-world scenarios.
          </p>
          <div className="p-4 rounded-lg bg-black/40 border border-neon-blue/20">
            <p className="text-sm text-neon-blue">
              Complete this module to earn the {module.nftReward.name} NFT reward!
            </p>
          </div>
        </div>
      )
    case 2:
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Key Concepts</h3>
          <p>Let's explore the key concepts related to {module.title.toLowerCase()}:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Understanding the fundamental principles</li>
            <li>Exploring the technology behind it</li>
            <li>Learning about the ecosystem and key players</li>
            <li>Identifying use cases and applications</li>
          </ul>
          <p>
            These concepts form the foundation of your understanding and will be essential for the practical
            applications we'll discuss later.
          </p>
        </div>
      )
    case 3:
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Practical Applications</h3>
          <p>Now that we understand the key concepts, let's look at how they apply in real-world scenarios:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-black/40 border border-neon-purple/20">
              <h4 className="font-bold text-neon-purple mb-2">Use Case 1</h4>
              <p className="text-sm">
                Description of the first practical application and how it leverages the concepts we've learned.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-black/40 border border-neon-blue/20">
              <h4 className="font-bold text-neon-blue mb-2">Use Case 2</h4>
              <p className="text-sm">
                Description of the second practical application and its benefits in the ecosystem.
              </p>
            </div>
          </div>
        </div>
      )
    case 4:
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Best Practices</h3>
          <p>Let's review some best practices to keep in mind:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Best Practice 1</p>
                <p className="text-sm text-muted-foreground">
                  Detailed explanation of the first best practice and why it's important.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Best Practice 2</p>
                <p className="text-sm text-muted-foreground">
                  Detailed explanation of the second best practice and its benefits.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Best Practice 3</p>
                <p className="text-sm text-muted-foreground">
                  Detailed explanation of the third best practice and how to implement it.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    case 5:
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Summary & Quiz</h3>
          <p>Congratulations on reaching the final step of this module! Let's summarize what we've learned:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We explored the fundamental concepts of {module.title.toLowerCase()}</li>
            <li>We examined practical applications and use cases</li>
            <li>We reviewed best practices and implementation strategies</li>
          </ul>
          <p className="mt-4 font-medium">
            To complete this module and earn your NFT reward, please answer the following question:
          </p>
          <div className="p-4 rounded-lg bg-black/40 border border-neon-purple/20 mt-2">
            <p className="font-medium text-neon-purple mb-2">Quiz Question:</p>
            <p className="mb-3">What is the primary benefit of implementing the concepts discussed in this module?</p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="radio" id="answer1" name="quiz" className="accent-neon-purple" />
                <label htmlFor="answer1">Enhanced security and privacy</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="answer2" name="quiz" className="accent-neon-purple" />
                <label htmlFor="answer2">Improved efficiency and scalability</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="answer3" name="quiz" className="accent-neon-purple" />
                <label htmlFor="answer3">Greater decentralization and autonomy</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" id="answer4" name="quiz" className="accent-neon-purple" />
                <label htmlFor="answer4">All of the above</label>
              </div>
            </div>
          </div>
        </div>
      )
    default:
      return null
  }
}

