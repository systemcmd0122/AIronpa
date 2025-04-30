import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import type { DebateResult } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const debateResult = (await request.json()) as DebateResult

    if (!debateResult.username || !debateResult.topic || !Array.isArray(debateResult.conversation)) {
      return NextResponse.json({ error: "無効なリクエスト形式です" }, { status: 400 })
    }

    // Supabaseに保存
    const { data, error } = await supabase
      .from("debate_results")
      .insert({
        username: debateResult.username,
        topic: debateResult.topic,
        conversation: debateResult.conversation,
        is_ai_defeated: debateResult.is_ai_defeated,
      })
      .select()

    if (error) {
      console.error("Supabaseエラー:", error)
      return NextResponse.json({ error: "データの保存に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data[0]?.id })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json({ error: "リクエスト処理中にエラーが発生しました" }, { status: 500 })
  }
}
