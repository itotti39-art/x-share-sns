import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { parseJsonBody } from '../_lib/parse-json-body';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = parseJsonBody<{ password?: unknown }>(req);
    const password = body.password != null ? String(body.password).trim() : '';

    if (!password || password.length !== 4) {
        return res.status(400).json({ success: false, error: '4桁のパスワードを入力してください' });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('settings')
            .select('password')
            .eq('id', 1)
            .single();

        if (error || !data) {
            console.error('Fetch password error:', error);
            // Supabase 未設定・行なしのときは UI の案内どおり 0000 のみ許可
            if (password === '0000') {
                return res.status(200).json({ success: true });
            }
            return res.status(500).json({ success: false, error: 'Failed to verify password' });
        }

        const stored = String(data.password ?? '').trim();
        if (password === stored) {
            return res.status(200).json({ success: true });
        }
        return res.status(401).json({ success: false, error: 'パスワードが間違っています' });
    } catch (e: any) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
