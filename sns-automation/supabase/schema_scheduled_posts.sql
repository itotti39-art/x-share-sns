-- 予約投稿用のテーブルの作成
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    platforms JSONB NOT NULL,
    image_url TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' -- 'pending', 'published', 'failed'
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access to scheduled_posts"
ON public.scheduled_posts FOR ALL USING (true);
