"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Trophy, ArrowLeft, RefreshCw, AlertTriangle, Frown, Minimize2, Maximize2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import type { DebateResult } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface HallResponse {
  results: DebateResult[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  timestamp?: string
}

export default function HallPage() {
  const [activeTab, setActiveTab] = useState<"fame" | "shame">("fame")
  const [fameData, setFameData] = useState<HallResponse | null>(null)
  const [shameData, setShameData] = useState<HallResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [famePage, setFamePage] = useState(1)
  const [shamePage, setShamePage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(Date.now())

  const fetchData = useCallback(async (type: "fame" | "shame", pageNum: number) => {
    setLoading(true)
    try {
      const timestamp = Date.now()
      const endpoint = type === "fame" ? "hall-of-fame" : "hall-of-shame"
      const response = await fetch(`/api/${endpoint}?page=${pageNum}&pageSize=5&timestamp=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error("データの取得に失敗しました")
      }
      
      const result = await response.json()
      if (type === "fame") {
        setFameData(result)
      } else {
        setShameData(result)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました")
      console.error("データ取得エラー:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "fame") {
      fetchData("fame", famePage)
    } else {
      fetchData("shame", shamePage)
    }
  }, [activeTab, famePage, shamePage, fetchData, refreshKey])

  const handlePageChange = (type: "fame" | "shame", direction: "prev" | "next") => {
    if (type === "fame") {
      if (direction === "prev" && famePage > 1) {
        setFamePage(famePage - 1)
      } else if (direction === "next" && fameData && famePage < fameData.totalPages) {
        setFamePage(famePage + 1)
      }
    } else {
      if (direction === "prev" && shamePage > 1) {
        setShamePage(shamePage - 1)
      } else if (direction === "next" && shameData && shamePage < shameData.totalPages) {
        setShamePage(shamePage + 1)
      }
    }
  }

  const handleRefresh = () => {
    setRefreshKey(Date.now())
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // レンダリング関数
  const renderResults = (data: HallResponse | null) => {
    if (loading) {
      return (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-full animate-pulse">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(2)].map((_, j) => (
                    <Skeleton key={j} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <Alert variant="destructive" className="animate-fadeIn">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="self-start">
              <RefreshCw className="h-4 w-4 mr-2" />
              再試行
            </Button>
          </AlertDescription>
        </Alert>
      )
    }

    if (!data || !data.results || data.results.length === 0) {
      return (
        <Card className="w-full border-dashed animate-fadeIn">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {activeTab === "fame" ? (
              <>
                <Trophy className="h-12 w-12 text-yellow-500/50 mb-4" />
                <p className="text-lg font-medium mb-2">まだ殿堂入りの記録がありません</p>
                <p className="text-muted-foreground mb-6">あなたが最初の論破者になりましょう！</p>
                <Link href="/">
                  <Button>議論を始める</Button>
                </Link>
              </>
            ) : (
              <>
                <Frown className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium mb-2">まだAIに敗北した記録がありません</p>
                <p className="text-muted-foreground">素晴らしい結果ですね！この調子で頑張りましょう。</p>
              </>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <>
        <div className="space-y-6">
          {data.results.map((result) => (
            <Card 
              key={`${result.id}-${refreshKey}`} 
              className={cn(
                "w-full border-2 transition-all duration-200 hover:shadow-lg",
                activeTab === "shame" 
                  ? "hover:border-red-200 dark:hover:border-red-800" 
                  : "hover:border-yellow-200 dark:hover:border-yellow-800"
              )}
            >
              <CardHeader className="border-b bg-muted/10 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Avatar className="h-8 w-8 mr-2 border-2 border-primary/10">
                        <AvatarFallback>{result.username ? result.username[0] : 'U'}</AvatarFallback>
                      </Avatar>
                      {result.username || 'ユーザー'}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <span className="font-medium text-foreground/70">議論テーマ:</span>{' '}
                      <span className="text-foreground/90">{result.topic || '不明なテーマ'}</span>
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/20 px-3 py-1.5 rounded-full">
                    <span>{result.created_at && formatDate(result.created_at)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {expandedId === result.id ? (
                    <div className="space-y-0.5">
                      {Array.isArray(result.conversation) &&
                        result.conversation.map((message, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "transition-colors duration-200",
                              message.role === "user"
                                ? "bg-primary/5 hover:bg-primary/10"
                                : "bg-muted/5 hover:bg-muted/10"
                            )}
                          >
                            <div className="px-6 py-4 max-w-[90%] mx-auto">
                              <div className="flex items-center gap-3 mb-2">
                                <Avatar className={cn(
                                  "h-8 w-8 border-2",
                                  message.role === "user" 
                                    ? "bg-primary/10 text-primary border-primary/20" 
                                    : "bg-secondary/10 text-secondary border-secondary/20"
                                )}>
                                  <AvatarFallback>
                                    {message.role === "user" ? result.username?.[0] || 'U' : 'AI'}
                                  </AvatarFallback>
                                  {message.role === "user" ? (
                                    <AvatarImage src="/user.png" alt={result.username} />
                                  ) : (
                                    <AvatarImage src="/ai.png" alt="AI" />
                                  )}
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium text-base">
                                    {message.role === "user" ? result.username || 'ユーザー' : "AI"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {message.role === "user" ? "ユーザーの発言" : "AIの返答"}
                                  </span>
                                </div>
                              </div>
                              <div className="text-foreground/90 whitespace-pre-wrap pl-11 text-base leading-relaxed">
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {Array.isArray(result.conversation) && result.conversation.length > 0 ? (
                      result.conversation.slice(-3).map((message, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "transition-colors duration-200",
                            message.role === "user"
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "bg-muted/5 hover:bg-muted/10"
                          )}
                        >
                          <div className="px-6 py-4 max-w-[90%] mx-auto">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className={cn(
                                "h-8 w-8 border-2",
                                message.role === "user" 
                                  ? "bg-primary/10 text-primary border-primary/20" 
                                  : "bg-secondary/10 text-secondary border-secondary/20"
                              )}>
                                <AvatarFallback>
                                  {message.role === "user" ? result.username?.[0] || 'U' : 'AI'}
                                </AvatarFallback>
                                {message.role === "user" ? (
                                  <AvatarImage src="/user.png" alt={result.username} />
                                ) : (
                                  <AvatarImage src="/ai.png" alt="AI" />
                                )}
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium text-base">
                                  {message.role === "user" ? result.username || 'ユーザー' : "AI"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {message.role === "user" ? "ユーザーの発言" : "AIの返答"}
                                </span>
                              </div>
                            </div>
                            <div className="text-foreground/90 whitespace-pre-wrap pl-11 text-base leading-relaxed">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground italic">
                        会話データがありません
                      </div>
                    )}
                    {Array.isArray(result.conversation) && result.conversation.length > 3 && (
                      <div className="py-3 text-center text-muted-foreground text-sm bg-muted/5 border-t border-border/30">
                        <p>全{result.conversation.length}件のメッセージのうち、最新の3件を表示しています</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/5 border-t">
              <Button 
                variant="outline" 
                onClick={() => toggleExpand(result.id || "")} 
                className={cn(
                  "w-full transition-all duration-200",
                  expandedId === result.id
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "hover:bg-muted/10"
                )}
                disabled={!Array.isArray(result.conversation) || result.conversation.length <= 3}
              >
                {expandedId === result.id ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    会話を折りたたむ
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    会話をすべて表示
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          全{data.totalCount}件中 {(activeTab === "fame" ? (famePage - 1) : (shamePage - 1)) * data.pageSize + 1}-
          {Math.min((activeTab === "fame" ? famePage : shamePage) * data.pageSize, data.totalCount)}件を表示
        </div>
        <div className="flex gap-2 order-1 sm:order-2">
          <Button 
            variant="outline" 
            onClick={() => handlePageChange(activeTab, "prev")} 
            disabled={(activeTab === "fame" ? famePage <= 1 : shamePage <= 1) || loading} 
            size="sm"
            className="min-w-[100px]"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> 前へ
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handlePageChange(activeTab, "next")} 
            disabled={
              !data || 
              (activeTab === "fame" 
                ? famePage >= data.totalPages 
                : shamePage >= data.totalPages
              ) || 
              loading
            } 
            size="sm"
            className="min-w-[100px]"
          >
            次へ <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  )
}

return (
  <main className="flex min-h-screen flex-col items-center p-2 sm:p-4 bg-gradient-to-b from-background to-muted/20">
    <div className="w-full max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center flex-wrap gap-2">
          <Link 
            href="/" 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 touch-target"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            トップに戻る
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
            <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2" />
            議論の記録
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 transition-all duration-200 touch-target w-full sm:w-auto justify-center"
        >
          <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
          最新の情報に更新
        </Button>
      </div>

      <div className="mb-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "fame" | "shame")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="fame" className="flex items-center gap-2 py-2 sm:py-3 touch-target">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="sm:inline">AIを論破</span>
              <span className="hidden sm:inline">した記録</span>
            </TabsTrigger>
            <TabsTrigger value="shame" className="flex items-center gap-2 py-2 sm:py-3 touch-target">
              <Frown className="h-4 w-4 text-red-500" />
              <span className="sm:inline">AIに敗北</span>
              <span className="hidden sm:inline">した記録</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="fame" className="animate-fadeIn">
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              これまでにAIを論破することに成功したユーザーとその議論内容を紹介します。
              優れた論理的思考と説得力のある議論から学びましょう。
            </p>
            {renderResults(fameData)}
          </TabsContent>
          <TabsContent value="shame" className="animate-fadeIn">
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              AIとの議論で敗北したケースを振り返り、より良い議論の参考にしましょう。
              失敗から学ぶことで、次回の議論に活かすことができます。
            </p>
            {renderResults(shameData)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </main>
)
}