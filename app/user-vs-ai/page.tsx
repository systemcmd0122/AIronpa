"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  Users,
  ArrowRight,
  ChevronLeft,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function UserVsAIPage() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const savedUsername = localStorage.getItem("username")
    if (savedUsername) {
      setUsername(savedUsername)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast({
        title: "エラー",
        description: "ユーザー名を入力してください",
        variant: "destructive",
      })
      return
    }

    localStorage.setItem("username", username)
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    router.push("/debate")
  }

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 bg-gradient-to-b from-background via-background to-muted/20">
      <motion.div
        className="w-full max-w-6xl mx-auto"
        {...fadeIn}
      >
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-8 hover:bg-background/50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            トップページに戻る
          </Button>
        </Link>

        <motion.div 
          className="w-full max-w-md mx-auto mb-8 text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4">
            ユーザー vs AI
          </h1>
          <p className="text-muted-foreground">
            AIと一対一で議論を行い、あなたの論理的思考力を試してみましょう。
            勝利すれば名誉の殿堂入りも夢ではありません。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-md mx-auto"
        >
          <Card className="relative overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
            <CardContent className="p-6 relative">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="flex items-center justify-center mb-6">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="ユーザー名を入力..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      AIとの議論で使用する名前を入力してください
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className={cn(
                    "w-full transition-all duration-300",
                    "bg-gradient-to-r from-primary to-primary/80",
                    "hover:from-primary/90 hover:to-primary/70",
                    "shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  )}
                >
                  <span className="flex items-center gap-2">
                    議論を始める
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </main>
  )
}