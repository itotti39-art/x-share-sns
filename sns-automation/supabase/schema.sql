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

-- 2回目以降の実行でもエラーにしない（ポリシーが既にある場合は作り直す）
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.settings;
CREATE POLICY "Allow public read access to settings"
ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update access to settings" ON public.settings;
CREATE POLICY "Allow public update access to settings"
ON public.settings FOR UPDATE USING (true);

-- 2. Storageバケットの作成（画像アップロード用）
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storageへのパブリックアクセス許可（誰でもInsertとSelect可能）
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR ALL
USING (bucket_id = 'images');

-- 既に id=1 の行があるがパスワードが違うとき 0000 に戻したい場合は、上とは別に次を1回だけ実行:
-- UPDATE public.settings SET password = '0000' WHERE id = 1;
