import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "10")
    const timestamp = searchParams.get("timestamp") || Date.now().toString()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // 敗北記録を取得
    const { data, error, count } = await supabase
      .from("debate_results")
      .select("*", { count: "exact" })
      .eq("is_ai_defeated", false)  // AIに敗北したケース
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Supabaseエラー:", error)
      return NextResponse.json({ error: "データの取得に失敗しました" }, { status: 500 })
    }

    const response = NextResponse.json({
      results: data,
      totalCount: count,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
      timestamp: timestamp,
    })

    response.headers.set('Cache-Control', 'no-store, max-age=0')
    return response
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json({ error: "リクエスト処理中にエラーが発生しました" }, { status: 500 })
  }
}