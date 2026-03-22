import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // pendingの投稿ID一覧を取得
        const { data: pendingData, error: pendingError } = await supabaseAdmin
            .from('scheduled_posts')
            .select('id')
            .eq('status', 'pending');

        if (pendingError) {
            throw pendingError;
        }

        // publishedの投稿ID一覧を取得
        const { data: publishedData, error: publishedError } = await supabaseAdmin
            .from('scheduled_posts')
            .select('id')
            .eq('status', 'published');

        if (publishedError) {
            throw publishedError;
        }

        const pending = pendingData.map(p => p.id);
        const completed = publishedData.map(p => p.id);

        return res.status(200).json({ pending, completed });
    } catch (error: any) {
        console.error('Status fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch status' });
    }
}
