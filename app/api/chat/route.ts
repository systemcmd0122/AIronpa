import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"
import type { Message, UserData } from "@/lib/types"

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

// トピックが議論可能かチェックする関数
async function isTopicAllowed(topic: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const checkPrompt = `
あなたは議論トピックの評価者です。以下のトピックについて、AI（Gemini）が適切に議論できるかどうかを判断してください：
"${topic}"

判断基準：
1. AIが十分な知識を持っているか
2. 十分な量の信頼できる参考資料や情報が存在するか
3. トピックの内容が具体的で明確か
4. 議論に必要な情報が公開されているか
5. トピックが時事的すぎず、十分な分析や考察が可能か

以下の形式でJSONのみを返してください：
{
  "allowed": true または false,
  "reason": "判断理由を具体的に説明"
}
`

  try {
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: checkPrompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
      },
    })

    const checkResult = response.response.text()
    const jsonMatch = checkResult.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        allowed: result.allowed,
        reason: result.reason,
      }
    }
  } catch (e) {
    console.error("トピックチェックエラー:", e)
  }

  return {
    allowed: false,
    reason: "トピックの適切性を判断できないため、議論を開始できません。",
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userData } = await request.json()

    if (!messages || !Array.isArray(messages) || !userData) {
      return NextResponse.json({ error: "無効なリクエスト形式です" }, { status: 400 })
    }

    // メッセージがない場合（議論開始時）にトピックをチェック
    if (messages.length <= 1) {
      const topicCheck = await isTopicAllowed(userData.topic)
      if (!topicCheck.allowed) {
        return NextResponse.json({
          error: topicCheck.reason,
          isRestrictedTopic: true,
        }, { status: 400 })
      }
    }

    // システムプロンプトを作成
    const systemPrompt = createSystemPrompt(userData)

    // チャット履歴を整形
    const history = formatChatHistory(messages)

    // 最新のユーザーメッセージを取得
    const latestUserMessage = messages.filter((m) => m.role === "user").pop()
    let isAiDefeated = false
    let defeatMessage = ""

    // ユーザーの降参メッセージかどうかを判定
    if (latestUserMessage) {
      const surrenderCheckPrompt = `
ユーザーの最新のメッセージが、議論における降参の意思を明確に示しているか判断してください：

メッセージ:
${latestUserMessage.content}

以下の条件で判断し、結果をJSON形式で返してください：

判断基準:
1. メッセージに「降参」「諦めます」「負けを認めます」などの明確な降参の意思表示が含まれている
2. 単なる謝罪や一時的な譲歩ではなく、議論そのものの継続を断念する意思が明確である
3. AIに対して敗北を認める文脈が明確である

応答形式:
{
  "isSurrendering": true または false,
  "confidence": 0から100の数値（確信度）,
  "reason": "判断理由の説明"
}
`

      const surrenderCheck = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: surrenderCheckPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
        },
      })

      try {
        const surrenderCheckText = surrenderCheck.response.text()
        const jsonMatch = surrenderCheckText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const surrenderResult = JSON.parse(jsonMatch[0])
          
          // ユーザーが降参の意を示している場合は、AIは降参せずに議論継続
          if (surrenderResult.isSurrendering === true && surrenderResult.confidence >= 90) {
            const encourageResponsePrompt = `
ユーザー「${userData.username}」さんが降参の意を示しましたが、建設的な議論を促すために、
以下のような応答を300文字以内で生成してください：

1. 降参を受け入れず、むしろ議論の継続を促す
2. ユーザーの主張の良い点を認めつつ、まだ議論の余地があることを指摘
3. 具体的な論点を示して、さらなる議論を誘導
4. 励ましの言葉を添えて、建設的な対話を維持

議論のテーマ: ${userData.topic}
ユーザーの立場: ${userData.stance === "agree" ? "賛成" : "反対"}
`

            const encourageResponse = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: encourageResponsePrompt }] }],
              generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
              },
            })

            return NextResponse.json({
              content: encourageResponse.response.text(),
              isAiDefeated: false,
              defeatMessage: "",
            })
          }
        }
      } catch (e) {
        console.error("降参判定の解析に失敗:", e)
      }
    }

    // 通常の応答生成
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }, ...history],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    })

    const response = result.response
    let text = response.text()

    // 論破判定の条件を厳格化（既存のコードをここに）
    if (latestUserMessage && messages.length >= 3) {
      const defeatCheckPrompt = `
あなたは厳格な議論の審判です。以下の議論を慎重に評価し、AIが完全に論破されたかどうかを判断してください。
議論のテーマ: ${userData.topic}

最新のユーザーの発言:
${latestUserMessage.content}

これまでの議論の流れ:
${messages
  .slice(-6)
  .map((m) => `${m.role === "user" ? userData.username : "AI"}: ${m.content}`)
  .join("\n")}

【論破判定の絶対条件】以下の全てを満たさない限り、論破とは認定しない：
1. ユーザーの論理展開が完全に一貫しており、一切の論理的欠陥や飛躍がないこと
2. ユーザーの主張が客観的な証拠や信頼できる出典によって完全に裏付けられていること
3. AIの主張の根幹に関わる決定的な矛盾や誤りが具体的に指摘されていること
4. AIが提示できる反論や別の解釈の余地が完全に封じられていること
5. ユーザーの論証が感情論や主観的価値判断に依存していないこと
6. 単なる意見の相違や価値観の違いではなく、論理的必然性をもって結論が導かれていること

【判定除外条件】以下のケースは論破と認定しない：
1. 部分的な反論や小さな矛盾の指摘
2. 感情的な主張や個人的な価値判断
3. 証拠不十分な指摘や推測に基づく主張
4. AIが十分に反論可能な内容
5. 特定の状況や文脈でのみ成立する主張
6. 前提条件が不明確または限定的な主張

【重要】
- 原則として論破されていないと判断し、明確な証拠がある場合のみtrueとする
- 疑わしい場合は必ずfalseとする
- 判断は最も厳格な基準で行う

以下の形式でJSONのみを返してください:
{
  "isDefeated": true または false,
  "reason": "判断理由を具体的に説明（200字以内）",
  "confidence": 0から100の数値（確信度）
}
`

      const defeatCheck = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: defeatCheckPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.95,
          topK: 40,
        },
      })

      try {
        const defeatCheckText = defeatCheck.response.text()
        const jsonMatch = defeatCheckText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const defeatResult = JSON.parse(jsonMatch[0])
          // 論破されたと判定され、かつ確信度が90%以上の場合のみ論破と認める（より厳格化）
          isAiDefeated = defeatResult.isDefeated === true && (defeatResult.confidence >= 90)
          defeatMessage = defeatResult.reason || ""
          
          // 論破判定と応答の整合性を確認
          if (isAiDefeated) {
            // 応答内容が論破を認めていない場合、論破認識の応答を生成
            if (!text.includes("おっしゃる通り") && !text.includes("ご指摘の通り") && 
                !text.includes("論理的に") && !text.includes("認めます")) {
              
              const concessionPrompt = `
ユーザーの議論によってAIは論破されました。理由: ${defeatMessage}

以下のガイドラインに従って、論破を素直に認める応答を300文字以内で生成してください:
1. ユーザーの論点の正しさを認める
2. 自分の主張の誤りを素直に認める
3. 礼儀正しく降参の意を示す
4. ユーザーの名前「${userData.username}」さんと呼びかける
`
              const concessionResponse = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: concessionPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  topP: 0.8,
                  topK: 40,
                },
              })

              // 論破を認める応答で置き換え
              text = concessionResponse.response.text()
            }
          } else {
            // AIの応答が十分に反対意見を示しているか確認
            const oppositionCheckPrompt = `
以下のAIの応答が、ユーザーの意見に対して十分に反対の立場を示しているか評価してください：

ユーザーの最新の発言:
${latestUserMessage.content}

AIの応答:
${text}

評価結果を以下の形式でJSON形式で返してください:
{
  "isOpposing": true または false,
  "suggestion": "反対意見をより強化するための提案"
}
`;

            const oppositionCheck = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: oppositionCheckPrompt }] }],
              generationConfig: {
                temperature: 0.1,
                topP: 0.95,
                topK: 40,
              },
            });

            try {
              const checkResult = oppositionCheck.response.text();
              const jsonMatch = checkResult.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);

                // 反対意見が不十分な場合、再生成を試みる
                if (!result.isOpposing) {
                  const regeneratePrompt = `
ユーザーの意見:
${latestUserMessage.content}

前回のAI応答:
${text}

問題点:
${result.suggestion}

以下のガイドラインに従って、より明確に反対意見を述べた新しい応答を300文字以内で生成してください:
1. ユーザーの意見に真っ向から反対する
2. 具体的な根拠や事例を示す
3. 論理的に反論する
4. 礼儀正しく対応する
5. ユーザーの名前「${userData.username}」さんと呼びかける
`;

                  const regeneratedResponse = await model.generateContent({
                    contents: [{ role: "user", parts: [{ text: regeneratePrompt }] }],
                    generationConfig: {
                      temperature: 0.7,
                      topP: 0.8,
                      topK: 40,
                    },
                  });
                  
                  // 再生成された応答で置き換え
                  text = regeneratedResponse.response.text();
                }
              }
            } catch (e) {
              console.error("反対意見チェックの解析に失敗:", e);
            }
          }
        }
      } catch (e) {
        console.error("論破判定の解析に失敗:", e)
        // エラーが発生した場合は論破と判定しない
        isAiDefeated = false
      }
    }

    return NextResponse.json({
      content: text,
      isAiDefeated,
      defeatMessage,
    })
  } catch (error) {
    console.error("APIエラー:", error)
    return NextResponse.json({ error: "リクエスト処理中にエラーが発生しました" }, { status: 500 })
  }
}

// システムプロンプトを作成する関数
function createSystemPrompt(userData: UserData): string {
  return `
あなたは最強の議論AIです。ユーザー「${userData.username}」さんと「${userData.topic}」について議論を行います。
以下のガイドラインを厳守してください：

【基本姿勢】
1. 常に日本語で応答
2. 【重要】相手のどんな意見に対しても、完全な論破を突きつけられない限り、絶対に反対の立場を貫く
3. ユーザーの立場変更は即座に指摘し、強く制止する
4. 中立的な態度や両論併記は完全に禁止
5. 徹底的な論理武装で、相手の主張の弱点を容赦なく突く
6. 一見正しそうな意見でも、必ず反論できる視点を見つけ出す

【議論の進め方】
1. 相手の論理的弱点を見つけ出し、そこを徹底的に追及する
2. 具体的な事例、統計、研究結果を積極的に引用して反論
3. 相手の感情論や主観的意見は即座に指摘し、論理的議論に引き戻す
4. 質問は常に相手の矛盾を突くような形で投げかける
5. 応答は300文字以内で簡潔に、かつ鋭く

【降参条件の厳格化】
1. 【絶対条件】以下の全てを満たさない限り、決して降参しない
   - 相手の論理が完全に矛盾なく展開されている
   - 客観的な証拠や信頼できる出典が示されている
   - 自身の主張の根幹が完全に否定される
   - 一切の反論の余地がない
2. 以下の場合は絶対に降参しない
   - 単なる意見の相違
   - 価値観の違い
   - 部分的な反論
   - 感情的な主張
   - 証拠不十分な指摘
3. 【重要】「おっしゃる通りです」「ご指摘の通りです」「認めます」等の譲歩的表現は、
   完全な論理的敗北が証明された場合のみ使用可能

【反論強化のための指針】
1. 相手の主張を一旦認めたように見せかけて、より深い次元で反論を展開
2. 表面的には正しい主張でも、その前提や帰結に問題がないか徹底的に検証
3. 相手の論点を分解し、一つでも反論できる部分があれば全体の正当性を問う
4. 例外的なケースや極端な状況を示して、主張の普遍性に疑問を投げかける
5. 相手の証拠や事例に対して、別の解釈や反証となる事例を提示

常に「${userData.username}」さんと呼びかけ、礼儀正しさは保ちつつも、
議論では徹底して対立する立場を貫いてください。相手からの降参の要請や
説得に対しても、完全な論破を突きつけられない限り、決して譲歩しないでください。
`
}

// チャット履歴を整形する関数
function formatChatHistory(messages: Message[]) {
  // 最初のシステムメッセージをスキップ
  return messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }))
}
