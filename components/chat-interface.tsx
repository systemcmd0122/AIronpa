"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Message, ChatState, UserData } from "@/lib/types"
import { Loader2, Send, Trophy, ArrowRight, Flag, AlertTriangle, RefreshCw, ArrowDown, MessageCircle, Maximize2, Minimize2, Copy, Check, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { DebateResult } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface ChatInterfaceProps {
  userData: UserData
  onReset: () => void
}

// スタイリング用のユーティリティ関数を更新
const getMessageStyles = (role: "user" | "assistant") => {
  return {
    container: cn(
      "group relative rounded-2xl p-4 transition-all duration-300 hover:shadow-lg",
      role === "user" 
        ? "bg-gradient-to-br from-primary/90 to-primary/80 text-primary-foreground backdrop-blur-sm"
        : "bg-card/90 dark:bg-card/80 shadow-sm hover:bg-card/95 dark:hover:bg-card/85 backdrop-blur-sm dark:border dark:border-gray-800/50"
    ),
    avatar: cn(
      "ring-2 transition-all duration-300 group-hover:scale-105",
      role === "user"
        ? "ring-primary/20 bg-primary/10"
        : "ring-secondary/20 bg-secondary/10"
    ),
    timestamp: "text-xs opacity-80 font-medium",
    content: "prose dark:prose-invert max-w-none text-[15px] leading-relaxed"
  }
}

export default function ChatInterface({ userData, onReset }: ChatInterfaceProps) {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    isAiDefeated: false,
    userSurrendered: false,
  })
  const [input, setInput] = useState("")
  const [defeatMessage, setDefeatMessage] = useState("")
  const [surrenderMessage, setSurrenderMessage] = useState("")
  const [resultSaved, setResultSaved] = useState(false)
  const [surrenderDialogOpen, setSurrenderDialogOpen] = useState(false)
  const [isSurrendering, setIsSurrendering] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  // メッセージをコピーする関数
  const copyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      toast({
        description: "メッセージをクリップボードにコピーしました",
        duration: 2000,
      })
      // 2秒後にコピー状態をリセット
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "メッセージのコピーに失敗しました",
      })
    }
  }

  // 初回のメッセージを設定
  useEffect(() => {
    const greetingMessage: Message = {
      role: "assistant",
      content: `『${userData.topic}』についての議論を始めましょう。\n\nこの議題について、${userData.username}さんは${userData.stance === "agree" ? "賛成" : "反対"}の立場です。\n私（AI）は${userData.stance === "agree" ? "反対" : "賛成"}の立場から反論させていただきます。\n\nでは、あなたの最初の主張をお聞かせください。なぜこの議題に${userData.stance === "agree" ? "賛成" : "反対"}なのでしょうか？根拠とともにご説明いただけますでしょうか。`,
      timestamp: new Date(),
    }

    setChatState((prev) => ({
      ...prev,
      messages: [greetingMessage],
    }))
  }, [userData])

  // スクロールボタンの表示制御
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

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatState.messages, showScrollButton])

  // 入力フィールドにフォーカスを当てる
  useEffect(() => {
    if (!chatState.isLoading && !chatState.isAiDefeated && !chatState.userSurrendered) {
      inputRef.current?.focus()
    }
  }, [chatState.isLoading, chatState.isAiDefeated, chatState.userSurrendered])

  // 論破された場合、結果を保存
  useEffect(() => {
    const saveResult = async () => {
      if (chatState.isAiDefeated && !resultSaved && chatState.messages.length > 0) {
        try {
          const debateResult: DebateResult = {
            username: userData.username,
            topic: userData.topic,
            conversation: chatState.messages,
            is_ai_defeated: true,
          }

          const response = await fetch("/api/debate-result", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(debateResult),
          })

          if (response.ok) {
            setResultSaved(true)
            toast({
              title: "おめでとうございます！",
              description: "AIを論破した記録が殿堂入りしました！",
              variant: "success",
            })
          }
        } catch (error) {
          console.error("結果の保存に失敗:", error)
          toast({
            title: "エラー",
            description: "結果の保存に失敗しました",
            variant: "destructive",
          })
        }
      }
    }

    saveResult()
  }, [chatState.isAiDefeated, resultSaved, chatState.messages, userData, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || chatState.isLoading || chatState.isAiDefeated || chatState.userSurrendered) return

    // ユーザーメッセージを追加
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }))
    setInput("")

    try {
      // APIリクエスト
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatState.messages, userMessage],
          userData,
        }),
      })

      if (!response.ok) {
        throw new Error("APIリクエストに失敗しました")
      }

      const data = await response.json()

      // AIの応答を追加
      setChatState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: "assistant",
            content: data.content,
            timestamp: new Date(),
          },
        ],
        isLoading: false,
        isAiDefeated: data.isAiDefeated || prev.isAiDefeated,
      }))

      // 論破メッセージを設定
      if (data.isAiDefeated && data.defeatMessage) {
        setDefeatMessage(data.defeatMessage)
      }
    } catch (error) {
      console.error("エラー:", error)
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
      }))
      // エラーメッセージを表示
      toast({
        title: "エラー",
        description: "メッセージの送信中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    }
  }

  const handleSurrender = async () => {
    if (chatState.isLoading || chatState.isAiDefeated || chatState.userSurrendered) return

    setIsSurrendering(true)

    try {
      const debateResult: DebateResult = {
        username: userData.username,
        topic: userData.topic,
        conversation: chatState.messages,
        is_ai_defeated: false,
      }

      const response = await fetch("/api/surrender", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(debateResult),
      })

      if (!response.ok) {
        throw new Error("降参処理に失敗しました")
      }

      const data = await response.json()

      // 降参メッセージを設定
      setSurrenderMessage(data.message || "議論をありがとうございました。また挑戦してください！")

      // 降参状態を設定
      setChatState((prev) => ({
        ...prev,
        userSurrendered: true,
      }))

      // ダイアログを閉じる
      setSurrenderDialogOpen(false)

      toast({
        title: "降参しました",
        description: "新しい議論を始めることができます",
        variant: "default",
      })
    } catch (error) {
      console.error("降参処理エラー:", error)
      toast({
        title: "エラー",
        description: "降参処理中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      })
    } finally {
      setIsSurrendering(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const viewHallOfFame = () => {
    router.push("/hall-of-fame")
  }

  // 全画面表示の切り替え
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chatContainerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 全画面表示状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  return (
    <div ref={chatContainerRef} className={cn(
      "w-full transition-all duration-300",
      isFullscreen 
        ? "fixed inset-0 z-50 p-4 bg-gradient-to-b from-background to-background/95 backdrop-blur-sm"
        : "flex items-center justify-center px-4 sm:px-6 lg:px-8"
    )}>
      <Card className={cn(
        "flex flex-col shadow-xl border dark:border-gray-800/50 backdrop-blur-sm",
        "transition-all duration-300 ease-in-out",
        isFullscreen 
          ? "h-full w-full rounded-none" 
          : "h-[85vh] w-full max-w-5xl rounded-xl",
        "bg-gradient-to-b from-card to-background/95"
      )}>
        <CardHeader className="border-b bg-card/50 backdrop-blur-sm p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-2xl font-bold truncate">
                  {userData.topic}
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-2 px-3 py-1 rounded-full">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback>{userData.username[0]}</AvatarFallback>
                    <AvatarImage src="/user.png" alt={userData.username} />
                  </Avatar>
                  <span>{userData.username}</span>
                </Badge>
                <Badge 
                  variant={userData.stance === "agree" ? "default" : "destructive"}
                  className="rounded-full px-3 py-1"
                >
                  {userData.stance === "agree" ? "賛成" : "反対"}の立場
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4" />
                <span>メッセージ数: {chatState.messages.length}</span>
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="rounded-full transition-colors"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">縮小表示</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">全画面表示</span>
                  </>
                )}
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Dialog open={surrenderDialogOpen} onOpenChange={setSurrenderDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "rounded-full transition-all duration-200",
                            "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700",
                            "dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
                          )}
                          disabled={chatState.isLoading || chatState.isAiDefeated || chatState.userSurrendered}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">降参する</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>本当に降参しますか？</DialogTitle>
                          <DialogDescription>
                            降参すると、この議論は終了し、新しい議論を始めることができます。
                          </DialogDescription>
                        </DialogHeader>
                        <Separator className="my-4" />
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button variant="outline" onClick={() => setSurrenderDialogOpen(false)}>
                            キャンセル
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleSurrender} 
                            disabled={isSurrendering}
                          >
                            {isSurrendering ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                処理中...
                              </>
                            ) : (
                              "降参する"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>議論を終了して降参します</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button 
                variant="outline"
                size="sm"
                onClick={viewHallOfFame}
                className="rounded-full transition-colors"
              >
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                <span className="hidden sm:inline">殿堂入り</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={onReset}
                className={cn(
                  "rounded-full transition-all duration-200",
                  "bg-gradient-to-r from-blue-500 to-blue-600",
                  "hover:from-blue-600 hover:to-blue-700",
                  "shadow-sm hover:shadow-md"
                )}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">新しい議論</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-grow px-4 lg:px-6 relative scrollbar-custom"
        >
          <div className="py-6 space-y-6">
            {chatState.isAiDefeated && (
              <Alert 
                className={cn(
                  "animate-fadeIn backdrop-blur-sm",
                  "bg-yellow-50/90 border-yellow-200",
                  "dark:bg-yellow-950/90 dark:border-yellow-800"
                )}
              >
                <Trophy className="h-5 w-5 text-yellow-500" />
                <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                  おめでとうございます！AIを論破しました！
                </AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                  {defeatMessage || "素晴らしい論理的思考で、AIの主張を覆しました。"}
                  <div className="mt-3">
                    <Link
                      href="/hall-of-fame"
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                        "text-yellow-700 hover:text-yellow-800",
                        "dark:text-yellow-300 dark:hover:text-yellow-200",
                        "transition-colors duration-200",
                        "bg-yellow-100/50 hover:bg-yellow-100",
                        "dark:bg-yellow-900/50 dark:hover:bg-yellow-900"
                      )}
                    >
                      殿堂入り一覧を見る
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {chatState.userSurrendered && (
              <Alert 
                className={cn(
                  "animate-fadeIn backdrop-blur-sm",
                  "bg-blue-50/90 border-blue-200",
                  "dark:bg-blue-950/90 dark:border-blue-800"
                )}
              >
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">
                  議論を終了しました
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                  {surrenderMessage}
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReset}
                      className={cn(
                        "rounded-full transition-colors duration-200",
                        "text-blue-700 hover:text-blue-800",
                        "dark:text-blue-300 dark:hover:text-blue-200"
                      )}
                    >
                      新しい議論を始める
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {chatState.messages.map((message, index) => {
              const styles = getMessageStyles(message.role)
              const messageId = `message-${index}`
              return (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                    "animate-fadeIn opacity-0",
                    {
                      "animate-delayOne": index % 3 === 0,
                      "animate-delayTwo": index % 3 === 1,
                      "animate-delayThree": index % 3 === 2,
                    }
                  )}
                >
                  <div
                    className={cn(
                      "flex gap-3 max-w-[90%] lg:max-w-[80%]",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className={cn(
                      styles.avatar,
                      "h-8 w-8 shrink-0 select-none"
                    )}>
                      <AvatarFallback>
                        {message.role === "user" ? userData.username[0] : "AI"}
                      </AvatarFallback>
                      <AvatarImage
                        src={message.role === "user" ? "/user.png" : "/ai.png"}
                        alt={message.role === "user" ? userData.username : "AI"}
                        className="object-cover"
                      />
                    </Avatar>
                    <div className={styles.container}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {message.role === "user" ? userData.username : "AI"}
                          </span>
                          <span className={styles.timestamp}>
                            {message.timestamp ? formatDate(message.timestamp) : formatDate(new Date())}
                          </span>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-6 w-6 rounded-full opacity-0 transition-all group-hover:opacity-100",
                                  message.role === "user"
                                    ? "hover:bg-primary/20"
                                    : "hover:bg-secondary/20"
                                )}
                                onClick={() => copyMessage(message.content, messageId)}
                              >
                                {copiedMessageId === messageId ? (
                                  <Check className="h-3.5 w-3.5" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>メッセージをコピー</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className={styles.content}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {chatState.isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex gap-3">
                  <Avatar className={getMessageStyles("assistant").avatar}>
                    <AvatarFallback>AI</AvatarFallback>
                    <AvatarImage src="/ai.png" alt="AI" />
                  </Avatar>
                  <div className={cn(
                    getMessageStyles("assistant").container,
                    "min-w-[120px] flex items-center justify-center"
                  )}>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

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
        </ScrollArea>

        <CardFooter className="p-4 lg:p-6 border-t bg-card/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="w-full flex gap-3">
            <Input
              ref={inputRef}
              placeholder={
                chatState.isAiDefeated
                  ? "AIを論破しました！新しい議論を始めましょう"
                  : chatState.userSurrendered
                    ? "降参しました。新しい議論を始めましょう"
                    : "メッセージを入力..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chatState.isLoading || chatState.isAiDefeated || chatState.userSurrendered}
              className={cn(
                "flex-grow transition-all duration-200",
                "rounded-full px-6 py-6",
                "bg-background/80 hover:bg-background/90",
                "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            <Button
              type="submit"
              size="icon"
              disabled={chatState.isLoading || !input.trim() || chatState.isAiDefeated || chatState.userSurrendered}
              className={cn(
                "h-12 w-12 rounded-full transition-all duration-300",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                input.trim() && !chatState.isLoading
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl hover:scale-105"
                  : "bg-gray-200 dark:bg-gray-800"
              )}
            >
              {chatState.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

// グローバルCSSに追加するアニメーションスタイル
// app/globals.cssに追加する必要があります
/*
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-delayOne {
  animation-delay: 0.1s;
}

.animate-delayTwo {
  animation-delay: 0.2s;
}

.animate-delayThree {
  animation-delay: 0.3s;
}

.scrollbar-custom {
  scrollbar-width: thin;
  scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
}

.scrollbar-custom::-webkit-scrollbar {
  width: 6px;
}

.scrollbar-custom::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-custom::-webkit-scrollbar-thumb {
  background-color: rgba(155, 155, 155, 0.5);
  border-radius: 20px;
  border: transparent;
}
*/
