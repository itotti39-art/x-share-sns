-- Supabase SQL Editor用: 初期セットアップクエリ

-- 1. 設定管理用テーブルの作成
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    password TEXT NOT NULL
);

-- 初期パスワード「0000」を挿入 (ID=1に固定)
INSERT INTO public.settings (id, password)
VALUES (1, '0000')
ON CONFLICT (id) DO NOTHING;

-- RLS（Row Level Security）の有効化とパブリックアクセス許可
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to settings"
ON public.settings FOR SELECT USING (true);

CREATE POLICY "Allow public update access to settings"
ON public.settings FOR UPDATE USING (true);

-- 2. Storageバケットの作成（画像アップロード用）
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storageへのパブリックアクセス許可（誰でもInsertとSelect可能）
CREATE POLICY "Public Access"
ON storage.objects FOR ALL
USING (bucket_id = 'images');
