import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load .env if running locally (e.g., using vercel dev)
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// セキュリティ上バックエンドではSERVICE_ROLE_KEYが理想ですが、今回はANON_KEYを使用
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase Environment Variables in Backend');
}

export const supabaseAdmin = createClient(
    supabaseUrl || 'http://localhost',
    supabaseKey || 'dummy',
    { auth: { persistSession: false } }
);
