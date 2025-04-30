import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { DebateResult } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const debateResult = (await request.json()) as DebateResult

    if (!debateResult.username || !debateResult.topic || !Array.isArray(debateResult.conversation)) {
      return NextResponse.json({ error: "無効なリクエスト形式です" }, { status: 400 })
    }

    // 降参結果をSupabaseに保存（is_ai_defeated = false）
    const { data, error } = await supabase
      .from("debate_results")
      .insert({
        username: debateResult.username,
        topic: debateResult.topic,
        conversation: debateResult.conversation,
        is_ai_defeated: false, // 降参したのでfalse
      })
      .select()

    if (error) {
      console.error("Supabaseエラー:", error)
      return NextResponse.json({ error: "データの保存に失敗しました" }, { status: 500 })
    }

    // 降参メッセージを生成
    const messages = [
      "議論をありがとうございました。また挑戦してください！",
      "次回はもっと良い議論ができるかもしれませんね。",
      "良い議論でした。また新しいお題で挑戦してみましょう！",
      "議論は難しいですが、練習あるのみです。次回も頑張りましょう！",
      "今回は降参されましたが、次回は論破できるかもしれませんね！",
    ]
    const randomMessage = messages[Math.floor(Math.random() * messages.length)]

    return NextResponse.json({
      success: true,
      id: data[0]?.id,
      message: randomMessage,
    })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json({ error: "リクエスト処理中にエラーが発生しました" }, { status: 500 })
  }
}
