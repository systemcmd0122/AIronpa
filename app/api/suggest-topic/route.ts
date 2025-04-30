import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

export async function GET(request: NextRequest) {
  try {
    const prompt = `
以下の条件を満たす議論のテーマを3つ提案してください：

条件：
1. 一般的な知識で議論可能なテーマ
2. 賛成/反対の立場が明確に分かれるテーマ
3. 倫理的・社会的な問題を含むテーマ
4. 過度に政治的・宗教的・差別的な内容は避ける
5. 具体的かつ明確な表現を使用する

以下の形式でJSONのみを返してください：
{
  "topics": [
    {
      "topic": "テーマの内容",
      "description": "なぜこのテーマが議論に適しているかの説明（100文字以内）",
      "proPoints": ["賛成派の主な論点1", "賛成派の主な論点2"],
      "conPoints": ["反対派の主な論点1", "反対派の主な論点2"]
    },
    // 同様に2つ目、3つ目のテーマ
  ]
}
`

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.8,
        topK: 40,
      },
    })

    const responseText = result.response.text()
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error("AIからの応答を解析できませんでした")
    }

    const topics = JSON.parse(jsonMatch[0])

    return NextResponse.json(topics)
  } catch (error) {
    console.error("トピック提案エラー:", error)
    return NextResponse.json(
      { error: "トピックの提案中にエラーが発生しました" },
      { status: 500 }
    )
  }
}