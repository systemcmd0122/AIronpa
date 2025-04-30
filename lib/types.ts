export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  isAiDefeated: boolean
  userSurrendered: boolean
}

export interface UserData {
  username: string
  topic: string
  stance: "agree" | "disagree"  // 追加：ユーザーの立場（賛成・反対）
}

export interface DebateResultResponse {
  isAiDefeated: boolean
  message: string
}

export interface SurrenderResponse {
  message: string
}
