import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { password } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('settings')
            .select('password')
            .eq('id', 1)
            .single();

        if (error || !data) {
            console.error('Fetch password error:', error);
            // デフォルトのフォールバック (念のため)
            if (password === '0000') {
               return res.status(200).json({ success: true });
            }
            return res.status(500).json({ success: false, error: 'Failed to verify password' });
        }

        if (password === data.password) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid password' });
        }
    } catch (e: any) {
        return res.status(500).json({ success: false, error: e.message });
    }
}
