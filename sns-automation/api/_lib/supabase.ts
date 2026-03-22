import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env if running locally (e.g., using vercel dev)
dotenv.config();

// サーバー（Vercel Functions）では VITE_ 以外の名前も使えるようにする（ダッシュボードで設定しやすい）
const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// API ルートでは service_role があれば RLS を確実にバイパスできる（推奨）
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase Environment Variables in Backend');
}

export const supabaseAdmin = createClient(
    supabaseUrl || 'http://localhost',
    supabaseKey || 'dummy',
    { auth: { persistSession: false } }
);
