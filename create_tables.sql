-- debate_resultsテーブルの作成
CREATE TABLE public.debate_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  topic TEXT NOT NULL,
  conversation JSONB NOT NULL,
  is_ai_defeated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLSポリシーの設定（オプション）
ALTER TABLE public.debate_results ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能なポリシー
CREATE POLICY "誰でも閲覧可能" ON public.debate_results
  FOR SELECT USING (true);

-- 認証されたユーザーのみ挿入可能なポリシー
CREATE POLICY "認証されたユーザーのみ挿入可能" ON public.debate_results
  FOR INSERT WITH CHECK (true);

-- インデックスの作成
CREATE INDEX debate_results_created_at_idx ON public.debate_results (created_at DESC);
CREATE INDEX debate_results_is_ai_defeated_idx ON public.debate_results (is_ai_defeated);
