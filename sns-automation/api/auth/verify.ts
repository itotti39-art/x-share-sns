import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { parseJsonBody } from '../_lib/parse-json-body';

/** 全角数字などを半角にし、数字4桁だけ残す */
function normalizeFourDigitPassword(raw: string): string {
    const map: Record<string, string> = {
        '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
        '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
    };
    const half = [...raw].map((c) => map[c] ?? c).join('');
    const digits = half.replace(/\D/g, '');
    return digits.slice(0, 4);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = parseJsonBody<{ password?: unknown }>(req);
    const raw = body.password != null ? String(body.password).trim() : '';
    const password = normalizeFourDigitPassword(raw);

    if (!password || password.length !== 4) {
        return res.status(400).json({ success: false, error: '4桁のパスワードを入力してください' });
    }

    const supabaseConfigured = Boolean(
        (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SUPABASE_ANON_KEY ||
            process.env.VITE_SUPABASE_ANON_KEY)
    );

    try {
        const { data, error } = await supabaseAdmin
            .from('settings')
            .select('password')
            .eq('id', 1)
            .single();

        if (error || !data) {
            console.error('Fetch password error:', error);
            // Supabase 未設定・接続失敗・行なしのときは UI の案内どおり 0000 のみ許可
            if (password === '0000') {
                return res.status(200).json({ success: true });
            }
            const hint = !supabaseConfigured
                ? 'Vercel の Environment Variables に SUPABASE_URL（または VITE_SUPABASE_URL）と SUPABASE_ANON_KEY（または VITE_SUPABASE_ANON_KEY）を設定してください。'
                : (error as { message?: string })?.message || 'settings テーブルに id=1 の行があるか確認してください。';
            return res.status(500).json({
                success: false,
                error: `認証サーバーで Supabase に接続できません: ${hint}`,
            });
        }

        const stored = String(data.password ?? '').trim();
        if (password === stored) {
            return res.status(200).json({ success: true });
        }
        return res.status(401).json({ success: false, error: 'パスワードが間違っています' });
    } catch (e: any) {
        if (password === '0000') {
            return res.status(200).json({ success: true });
        }
        return res.status(500).json({
            success: false,
            error: e?.message || '認証処理でエラーが発生しました',
        });
    }
}
