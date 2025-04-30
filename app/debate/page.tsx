"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import TopicForm from "@/components/topic-form"
import ChatInterface from "@/components/chat-interface"
import type { UserData } from "@/lib/types"

export default function DebatePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [topicSelected, setTopicSelected] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // ローカルストレージからユーザー名を取得
    const username = localStorage.getItem("username")
    if (!username) {
      // ユーザー名がなければトップページにリダイレクト
      router.push("/")
      return
    }

    setUserData({ username, topic: "", stance: "agree" })
  }, [router])

  const handleTopicSelected = (topic: string, stance: "agree" | "disagree") => {
    if (userData) {
      setUserData({ ...userData, topic, stance })
      setTopicSelected(true)
    }
  }

  const handleReset = () => {
    setTopicSelected(false)
    if (userData) {
      setUserData({ ...userData, topic: "", stance: "agree" })
    }
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-4">
          <div className="loading-container">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          <p className="text-muted-foreground animate-fadeIn">データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <h1 className="text-4xl font-bold mb-8 text-center text-foreground">君はAIを論破できる？</h1>

      {!topicSelected ? (
        <TopicForm onTopicSelected={handleTopicSelected} />
      ) : (
        <ChatInterface userData={userData} onReset={handleReset} />
      )}
    </main>
  )
}
