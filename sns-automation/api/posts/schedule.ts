import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { id, content, platforms, imageUrl, scheduledAt } = req.body;

    if (!id || !content || !platforms || !scheduledAt) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('scheduled_posts')
            .insert({
                id,
                content,
                platforms,
                image_url: imageUrl || null,
                scheduled_at: new Date(scheduledAt).toISOString(),
                status: 'pending'
            });

        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error('Failed to insert scheduled post');
        }

        return res.status(200).json({ success: true, message: 'Post scheduled successfully' });
    } catch (error: any) {
        console.error('Schedule error:', error);
        return res.status(500).json({ error: 'Failed to schedule post' });
    }
}
