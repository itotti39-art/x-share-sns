import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { parseJsonBody } from '../_lib/parse-json-body';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = parseJsonBody<{ currentPassword?: unknown; newPassword?: unknown }>(req);
    const currentPassword =
        body.currentPassword != null ? String(body.currentPassword).trim() : '';
    const newPassword = body.newPassword != null ? String(body.newPassword).trim() : '';

    try {
        const { data: currentData, error: fetchError } = await supabaseAdmin
            .from('settings')
            .select('password')
            .eq('id', 1)
            .single();

        if (fetchError || !currentData) {
            return res.status(500).json({ success: false, error: 'Failed to verify current password' });
        }

        const stored = String(currentData.password ?? '').trim();
        if (currentPassword !== stored) {
            return res.status(401).json({ success: false, error: '現在のパスワードが間違っています' });
        }

        if (!newPassword || newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
            return res.status(400).json({ success: false, error: '新しいパスワードは4桁の数字で入力してください' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('settings')
            .update({ password: newPassword })
            .eq('id', 1);

        if (updateError) {
            throw updateError;
        }

        return res.status(200).json({ success: true });
    } catch (e: any) {
        console.error('Change password error:', e);
        return res.status(500).json({ success: false, error: e.message || 'Error changing password' });
    }
}
