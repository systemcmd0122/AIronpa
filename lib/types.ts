export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
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
  stance: "agree" | "disagree"
}

export interface DebateResultResponse {
  isAiDefeated: boolean
  message: string
}

export interface SurrenderResponse {
  message: string
}

export interface AIDebateMessage {
  role: "agree" | "disagree"
  content: string
  timestamp: Date
}
