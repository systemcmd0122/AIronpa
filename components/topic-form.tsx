"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, RotateCw } from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"

interface TopicFormProps {
  onTopicSelected: (topic: string, stance: "agree" | "disagree") => void
}

interface SuggestedTopic {
  topic: string
  description: string
  proPoints: string[]
  conPoints: string[]
}

export default function TopicForm({ onTopicSelected }: TopicFormProps) {
  const [topic, setTopic] = useState("")
  const [stance, setStance] = useState<"agree" | "disagree">("agree")
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestedTopics, setSuggestedTopics] = useState<SuggestedTopic[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast({
        title: "エラー",
        description: "議論のテーマを入力してください",
        variant: "destructive",
      })
      return
    }
    onTopicSelected(topic, stance)
  }

  const handleGetSuggestions = async () => {
    if (!showSuggestions) {
      setShowSuggestions(true)
    }
    setIsGenerating(true)
    try {
      const response = await fetch("/api/suggest-topic")
      if (!response.ok) {
        throw new Error("提案の取得に失敗しました")
      }
      const data = await response.json()
      if (data.topics && Array.isArray(data.topics)) {
        setSuggestedTopics(data.topics)
      } else {
        throw new Error("不正なレスポンス形式です")
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "テーマの提案中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectTopic = (selectedTopic: string) => {
    setTopic(selectedTopic)
    setShowSuggestions(false)
  }

  return (
    <Card className="w-full max-w-xl shadow-lg border-2 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">議論のテーマを決めましょう</CardTitle>
        <CardDescription>
          AIと議論したいテーマを入力するか、AIからの提案から選んでください
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">テーマ</Label>
              <div className="flex gap-2">
                <Input
                  id="topic"
                  placeholder="例：学校での制服は必要か"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetSuggestions}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="loading-spinner mr-2" />
                          提案を取得中...
                        </div>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          AIに提案を求める
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <DialogTitle>AIからのテーマ提案</DialogTitle>
                          <DialogDescription>
                            以下のテーマから選んでください。各テーマには賛成・反対の主な論点が含まれています。
                          </DialogDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleGetSuggestions}
                          disabled={isGenerating}
                          className="shrink-0 ml-2"
                          title="テーマを再生成"
                        >
                          <RotateCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                        </Button>
                      </div>
                    </DialogHeader>
                    {isGenerating ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="loading-container">
                          <div className="loading-dot"></div>
                          <div className="loading-dot"></div>
                          <div className="loading-dot"></div>
                        </div>
                        <p className="text-sm text-muted-foreground animate-fadeIn">
                          AIがテーマを考えています...
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <Accordion type="single" collapsible className="w-full">
                          {suggestedTopics.map((suggested, index) => (
                            <AccordionItem key={index} value={`topic-${index}`}>
                              <AccordionTrigger className="text-left">
                                {suggested.topic}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 p-4">
                                  <p className="text-sm text-muted-foreground">
                                    {suggested.description}
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">
                                        賛成派の主な論点
                                      </h4>
                                      <ul className="list-disc list-inside space-y-1 text-sm">
                                        {suggested.proPoints.map((point, i) => (
                                          <li key={i}>{point}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">
                                        反対派の主な論点
                                      </h4>
                                      <ul className="list-disc list-inside space-y-1 text-sm">
                                        {suggested.conPoints.map((point, i) => (
                                          <li key={i}>{point}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                  <Button
                                    className="w-full mt-4"
                                    onClick={() => handleSelectTopic(suggested.topic)}
                                  >
                                    このテーマを選ぶ
                                  </Button>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              <Label>あなたの立場</Label>
              <RadioGroup
                value={stance}
                onValueChange={(value) => setStance(value as "agree" | "disagree")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="agree" id="agree" />
                  <Label htmlFor="agree">賛成</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disagree" id="disagree" />
                  <Label htmlFor="disagree">反対</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={!topic.trim()}>
            議論を始める
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
