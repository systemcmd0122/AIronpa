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
  ThumbsUp,
  ThumbsDown,
  MessagesSquare,
  ChevronLeft,
  Sparkles,
  AlertCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { AIDebateMessage } from "@/lib/types"

interface AIDebateProps {
  onReset: () => void
}

const getMessageStyles = (role: "agree" | "disagree") => {
  return {
    container: cn(
      "group relative rounded-2xl px-4 py-6 transition-all duration-300",
      "hover:shadow-lg backdrop-blur-sm",
      role === "agree" 
        ? "bg-gradient-to-br from-emerald-500/90 via-emerald-600/80 to-emerald-700/90 text-white"
        : "bg-gradient-to-br from-rose-500/90 via-rose-600/80 to-rose-700/90 text-white"
    ),
    avatar: cn(
      "ring-2 transition-all duration-300 group-hover:scale-105",
      role === "agree"
        ? "ring-emerald-200 bg-emerald-100"
        : "ring-rose-200 bg-rose-100"
    ),
    badge: cn(
      "absolute -top-3 left-4 px-3 py-1 text-xs font-medium rounded-full",
      "shadow-sm backdrop-blur-sm",
      role === "agree"
        ? "bg-emerald-200/90 text-emerald-900"
        : "bg-rose-200/90 text-rose-900"
    ),
    timestamp: "text-xs text-white/80 font-medium",
    content: "prose prose-invert max-w-none text-[15px] leading-relaxed"
  }
}

export default function AIDebate({ onReset }: AIDebateProps) {
  const [topic, setTopic] = useState("")
  const [debateType, setDebateType] = useState<"logical" | "casual">("logical")
  const [messages, setMessages] = useState<AIDebateMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDebating, setIsDebating] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
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

      // 1回目の反論を自動的に取得
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
    if (messages.length === 0) return

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
    setTopic("")
    setMessages([])
    setIsDebating(false)
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="shadow-xl border-2">
        <CardHeader className="border-b bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <Brain className="w-6 h-6" />
              AI同士の議論
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-full transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                リセット
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
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
            className="h-[60vh] px-4 lg:px-6 relative scrollbar-custom"
          >
            {messages.length > 0 ? (
              <div className="py-6 space-y-8">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => {
                    const styles = getMessageStyles(message.role)
                    return (
                      <motion.div
                        key={index}
                        className={cn(
                          "flex",
                          message.role === "agree" ? "justify-start" : "justify-end",
                        )}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div
                          className={cn(
                            "flex gap-3 max-w-[90%] lg:max-w-[80%]",
                            message.role === "agree" ? "flex-row" : "flex-row-reverse"
                          )}
                        >
                          <div className="relative z-10">
                            <Avatar className={cn(
                              styles.avatar,
                              "h-10 w-10 shrink-0 select-none"
                            )}>
                              <AvatarFallback>
                                {message.role === "agree" ? 
                                  <ThumbsUp className="w-5 h-5" /> : 
                                  <ThumbsDown className="w-5 h-5" />
                                }
                              </AvatarFallback>
                              <AvatarImage 
                                src="/ai.png" 
                                alt={message.role === "agree" ? "賛成AI" : "反対AI"}
                                className="object-cover"
                              />
                            </Avatar>
                          </div>
                          <div className={styles.container}>
                            <div className={styles.badge}>
                              {message.role === "agree" ? "賛成派" : "反対派"}
                            </div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-sm font-semibold">
                                {message.role === "agree" ? "賛成AI" : "反対AI"}
                              </span>
                              <span className={styles.timestamp}>
                                {formatDate(message.timestamp)}
                              </span>
                            </div>
                            <div className={styles.content}>
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {isLoading && (
                    <motion.div 
                      className="flex justify-start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex gap-3">
                        <div className="relative z-10">
                          <Avatar className={getMessageStyles(messages[messages.length - 1]?.role === "agree" ? "disagree" : "agree").avatar}>
                            <AvatarFallback>
                              {messages[messages.length - 1]?.role === "agree" ? 
                                <ThumbsDown className="w-5 h-5" /> : 
                                <ThumbsUp className="w-5 h-5" />
                              }
                            </AvatarFallback>
                            <AvatarImage 
                              src="/ai.png" 
                              alt="AI" 
                              className="object-cover"
                            />
                          </Avatar>
                        </div>
                        <div className={cn(
                          getMessageStyles(messages[messages.length - 1]?.role === "agree" ? "disagree" : "agree").container,
                          "min-w-[120px] flex items-center justify-center"
                        )}>
                          <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <motion.div 
                className="h-full flex flex-col items-center justify-center text-center p-8"
                {...fadeIn}
              >
                <Brain className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">議論の準備ができました</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  テーマを入力して議論を開始してください。AIが賛成派と反対派に分かれて議論を展開します。
                </p>
              </motion.div>
            )}
          </ScrollArea>

          {showScrollButton && (
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "fixed bottom-24 right-6 lg:bottom-8",
                "rounded-full shadow-lg hover:shadow-xl",
                "transition-all duration-200",
                "bg-background/80 backdrop-blur-sm",
                "z-10"
              )}
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </CardContent>

        <CardFooter className="p-4 border-t bg-card/50 backdrop-blur-sm">
          <div className="w-full flex justify-center">
            <Button
              onClick={continueDebate}
              disabled={!isDebating || isLoading || messages.length === 0}
              size="lg"
              className={cn(
                "rounded-full transition-all duration-300",
                "px-6 py-6 text-base",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isDebating && !isLoading
                  ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-gray-200 dark:bg-gray-800"
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  生成中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  議論を続ける
                </span>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}