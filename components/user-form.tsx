"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain } from 'lucide-react'

export default function UserForm() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // ローカルストレージからユーザー名を復元
  useEffect(() => {
    const savedUsername = localStorage.getItem("username")
    if (savedUsername) {
      setUsername(savedUsername)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setIsLoading(true)
    // ユーザー名をローカルストレージに保存
    localStorage.setItem("username", username)
    router.push("/debate")
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-2 dark:border-gray-800 animate-fadeIn">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-2">
          <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full">
            <Brain className="h-6 w-6 text-primary dark:text-primary/90" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-foreground">ようこそ！</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          AIとの議論を始める前に、あなたのお名前を教えてください。
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Input
                id="username"
                placeholder="お名前を入力してください"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="text-lg bg-background"
                autoFocus
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full transition-all duration-200" 
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary-foreground rounded-full mx-1 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce"></div>
              </div>
            ) : (
              "次へ進む"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
