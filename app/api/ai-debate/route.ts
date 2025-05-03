import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"
import type { AIDebateMessage } from "@/lib/types"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

export async function POST(request: NextRequest) {
  try {
    const { topic, debateType, messages } = await request.json()

    if (!topic) {
      return NextResponse.json(
        { error: "議論のテーマが必要です" },
        { status: 400 }
      )
    }

    // 議論のタイプに応じてプロンプトを調整
    const isLogicalDebate = debateType === "logical"

    // システムプロンプトを作成
    const prompt = `
あなたは議論AI（${messages.length === 0 || messages[messages.length - 1]?.role === "disagree" ? "賛成派" : "反対派"}）として、
「${topic}」について${messages.length === 0 ? "最初の主張" : "反論"}を行います。

${isLogicalDebate ? `
【論理的議論モード】
1. 客観的な事実やデータに基づいて議論を展開
2. 論理的な因果関係を明確に示す
3. 信頼できる出典や研究結果を引用
4. 感情的な表現を避け、理性的に議論
5. 反論は相手の論理的な矛盾を指摘` : `
【カジュアル議論モード】
1. より柔軟で身近な例を用いて議論
2. 個人の経験や直感的な理解も重視
3. 分かりやすい比喩や例え話を活用
4. 親しみやすい表現で議論を展開
5. 相手の意見の不自然さや実現可能性を議論`}

【共通ガイドライン】
1. 応答は300文字以内
2. 一貫した立場を保持
3. 建設的な議論を心がける
4. 相手の意見を踏まえて反論
5. 礼儀正しい表現を使用

${messages.length > 0 ? `
これまでの議論:
${messages.map((m: AIDebateMessage, i: number) => 
  `${m.role === "agree" ? "賛成派" : "反対派"}: ${m.content}`
).join("\n\n")}

上記の議論を踏まえて、新たな${messages[messages.length - 1]?.role === "agree" ? "反論" : "主張"}を展開してください。
` : "テーマについて最初の主張を展開してください。"}

応答は議論内容のみを返してください。
`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: isLogicalDebate ? 0.7 : 0.8,
        topP: 0.8,
        topK: 40,
      },
    })

    return NextResponse.json({ content: result.response.text() })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json(
      { error: "議論の生成中にエラーが発生しました" },
      { status: 500 }
    )
  }
}