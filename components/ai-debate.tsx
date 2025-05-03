"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  ArrowDown, 
  Brain, 
  RefreshCw, 
  Send,
  MessagesSquare,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  Bot,
  Lock,
  Unlock
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { AIDebateMessage } from "@/lib/types"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface AIDebateProps {
  onReset: () => void
  isAIvsAI?: boolean
}

const styles = {
  messageBox: (role: "agree" | "disagree") => cn(
    "relative p-4 rounded-lg mb-4",
    "transition-all duration-200",
    "max-w-[80%]",
    role === "agree" 
      ? "bg-blue-500/10 text-blue-900 dark:text-blue-100 ml-0 mr-auto"
      : "bg-red-500/10 text-red-900 dark:text-red-100 ml-auto mr-0"
  ),
  aiAvatar: (role: "agree" | "disagree") => cn(
    "absolute top-4",
    "bg-transparent",
    role === "agree" 
      ? "left-[-3rem]"
      : "right-[-3rem]"
  ),
  badge: (role: "agree" | "disagree") => cn(
    "inline-block px-2 py-0.5 rounded text-xs font-medium mb-1",
    role === "agree"
      ? "bg-blue-200/90 text-blue-900"
      : "bg-red-200/90 text-red-900"
  ),
  timestamp: "text-xs text-muted-foreground font-medium",
  content: "prose max-w-none text-[15px] leading-relaxed"
}

export default function AIDebate({ onReset, isAIvsAI = false }: AIDebateProps) {
  const [topic, setTopic] = useState("")
  const [debateType, setDebateType] = useState<"logical" | "casual">("logical")
  const [messages, setMessages] = useState<AIDebateMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDebating, setIsDebating] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [debateSpeed, setDebateSpeed] = useState(3)
  const [isContinueLocked, setIsContinueLocked] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const autoDebateRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLDivElement
      const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      scrollArea.addEventListener("scroll", handleScroll)
      return () => scrollArea.removeEventListener("scroll", handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, showScrollButton])

  useEffect(() => {
    return () => {
      if (autoDebateRef.current) {
        clearTimeout(autoDebateRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isAIvsAI && isDebating && !isLoading && messages.length > 0 && !isContinueLocked) {
      const delay = (6 - debateSpeed) * 1000
      autoDebateRef.current = setTimeout(() => {
        continueDebate()
      }, delay)
    }
    return () => {
      if (autoDebateRef.current) {
        clearTimeout(autoDebateRef.current)
      }
    }
  }, [isAIvsAI, isDebating, isLoading, messages, debateSpeed, isContinueLocked])

  const startDebate = async () => {
    if (!topic.trim()) {
      toast({
        title: "エラー",
        description: "議論のテーマを入力してください",
        variant: "destructive",
      })
      return
    }

    if (topic.length < 5) {
      toast({
        title: "エラー",
        description: "議論のテーマは5文字以上で入力してください",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setIsDebating(true)
    
    try {
      const response = await fetch("/api/ai-debate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          topic,
          debateType,
          messages: []
        }),
      })

      if (!response.ok) {
        throw new Error("議論の開始に失敗しました")
      }

      const data = await response.json()
      setMessages([{
        role: "agree",
        content: data.content,
        timestamp: new Date(),
      }])

      const counterResponse = await fetch("/api/ai-debate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          debateType,
          messages: [{
            role: "agree",
            content: data.content,
            timestamp: new Date(),
          }],
        }),
      })

      if (!counterResponse.ok) {
        throw new Error("反論の取得に失敗しました")
      }

      const counterData = await counterResponse.json()
      setMessages(prev => [...prev, {
        role: "disagree",
        content: counterData.content,
        timestamp: new Date(),
      }])
    } catch (error) {
      console.error("エラー:", error)
      toast({
        title: "エラー",
        description: "議論の開始中にエラーが発生しました",
        variant: "destructive",
      })
      setIsDebating(false)
    } finally {
      setIsLoading(false)
    }
  }

  const continueDebate = async () => {
    if (messages.length === 0 || isContinueLocked) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/ai-debate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          debateType,
          messages,
        }),
      })

      if (!response.ok) {
        throw new Error("議論の継続に失敗しました")
      }

      const data = await response.json()
      
      if (data.debateEnded) {
        setIsDebating(false)
        toast({
          title: "議論終了",
          description: data.endReason,
        })
        return
      }

      setMessages(prev => [...prev, {
        role: messages[messages.length - 1].role === "agree" ? "disagree" : "agree",
        content: data.content,
        timestamp: new Date(),
      }])
    } catch (error) {
      console.error("エラー:", error)
      toast({
        title: "エラー",
        description: "議論の継続中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (autoDebateRef.current) {
      clearTimeout(autoDebateRef.current)
    }
    setTopic("")
    setMessages([])
    setIsDebating(false)
    setIsContinueLocked(false)
    onReset()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date)
  }

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  }

  return (
    <motion.div 
      className="w-full max-w-5xl"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
    >
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleReset} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              戻る
            </Button>
            {isAIvsAI && (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <Label className="text-sm">議論の速さ</Label>
                  <Slider
                    value={[debateSpeed]}
                    onValueChange={(value) => setDebateSpeed(value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={!isDebating || isContinueLocked}
                    className="w-32"
                  />
                </div>
                {isDebating && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-2">
                        <Switch
                          checked={!isContinueLocked}
                          onCheckedChange={(checked) => setIsContinueLocked(!checked)}
                          disabled={!isDebating}
                          className="data-[state=checked]:bg-primary"
                        />
                        {isContinueLocked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Unlock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>継続を{isContinueLocked ? "ロック" : "自動化"}する</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
          <CardTitle className="flex items-center justify-center gap-2 pt-2">
            <Brain className="h-6 w-6" />
            {isAIvsAI ? "AI vs AI 議論" : "議論フォーム"}
          </CardTitle>
        </CardHeader>

        <div className="p-6 border-b bg-muted/30">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>議論のタイプ</Label>
                {isDebating && (
                  <div className="flex items-center text-xs text-amber-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    議論開始後は変更できません
                  </div>
                )}
              </div>
              <RadioGroup
                value={debateType}
                onValueChange={(value) => !isDebating && setDebateType(value as "logical" | "casual")}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className={cn(
                  "flex items-center space-x-2",
                  isDebating && debateType !== "logical" && "opacity-50"
                )}>
                  <RadioGroupItem 
                    value="logical" 
                    id="logical" 
                    disabled={isDebating}
                  />
                  <Label 
                    htmlFor="logical" 
                    className={cn(
                      "font-medium cursor-pointer",
                      isDebating && !isDebating && "cursor-not-allowed"
                    )}
                  >
                    論理的議論
                    <span className="block text-xs text-muted-foreground">
                      厳密な論理と証拠に基づく議論
                    </span>
                  </Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2",
                  isDebating && debateType !== "casual" && "opacity-50"
                )}>
                  <RadioGroupItem 
                    value="casual" 
                    id="casual" 
                    disabled={isDebating}
                  />
                  <Label 
                    htmlFor="casual" 
                    className={cn(
                      "font-medium cursor-pointer",
                      isDebating && !isDebating && "cursor-not-allowed"
                    )}
                  >
                    カジュアル議論
                    <span className="block text-xs text-muted-foreground">
                      より柔軟でオープンな議論
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>議論のテーマ</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="議論のテーマを入力..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isDebating}
                  className="rounded-full"
                />
                <Button
                  onClick={startDebate}
                  disabled={isLoading || isDebating || !topic.trim()}
                  className="rounded-full min-w-[100px]"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <MessagesSquare className="h-4 w-4" />
                      開始
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea 
          ref={scrollAreaRef}
          className="h-[60vh] px-6 lg:px-8 relative scrollbar-custom"
        >
          {messages.length > 0 ? (
            <div className="py-4 relative">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "relative max-w-full",
                      message.role === "agree" ? "pl-12 pr-4" : "pr-12 pl-4"
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.messageBox(message.role)}>
                      <div className={styles.aiAvatar(message.role)}>
                        <Avatar>
                          <AvatarFallback className="bg-background">
                            <Bot className="w-5 h-5" />
                          </AvatarFallback>
                          <AvatarImage 
                            src={"/ai.png"}
                            alt={message.role === "agree" ? "賛成AI" : "反対AI"}
                          />
                        </Avatar>
                      </div>
                      <div>
                        <div className={styles.badge(message.role)}>
                          {message.role === "agree" ? "賛成派" : "反対派"}
                        </div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold">
                            {message.role === "agree" ? "賛成AI" : "反対AI"}
                          </span>
                          <span className={styles.timestamp}>
                            {formatDate(new Date(message.timestamp))}
                          </span>
                        </div>
                        <div className={styles.content}>
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium mb-2">議論の準備ができました</p>
              <p className="text-sm">
                テーマを入力して、AIとの議論を開始してください。
                {isAIvsAI && "AIどうしの議論を見守りましょう。"}
              </p>
            </div>
          )}
        </ScrollArea>

        {showScrollButton && (
          <Button
            size="icon"
            variant="outline"
            className="absolute bottom-20 right-4 rounded-full w-8 h-8 transition-all duration-200 bg-background/80 backdrop-blur-sm z-10"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}

        <CardFooter className="p-4 border-t bg-card/50 backdrop-blur-sm">
          <div className="w-full flex justify-center items-center gap-4">
            <Button
              onClick={continueDebate}
              disabled={!isDebating || isLoading || messages.length === 0 || (isAIvsAI && !isContinueLocked)}
              size="lg"
              className={cn(
                "rounded-full transition-all duration-300",
                "px-6 py-6 text-base",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isDebating && !isLoading
                  ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:scale-105"
                  : ""
              )}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.div>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  継続
                </span>
              )}
            </Button>

            {isAIvsAI && isDebating && (
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">速度: </Label>
                <Slider
                  value={[debateSpeed]}
                  onValueChange={(value) => setDebateSpeed(value[0])}
                  min={1}
                  max={5}
                  step={1}
                  disabled={!isDebating || isContinueLocked}
                  className="w-24"
                />
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}