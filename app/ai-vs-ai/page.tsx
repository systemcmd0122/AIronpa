"use client"

import AIDebate from "@/components/ai-debate"
import { motion } from "framer-motion"

export default function AIvsAIPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 bg-gradient-to-b from-background via-background to-muted/20">
      <motion.div 
        className="w-full max-w-5xl mx-auto mb-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          AI vs AI 議論劇場
        </h1>
        <p className="text-muted-foreground mt-2">
          AIが賛成派と反対派に分かれて熱い議論を展開します
        </p>
      </motion.div>

      <AIDebate onReset={() => {}} />
    </main>
  )
}