import type { VercelRequest, VercelResponse } from '@vercel/node';
import { publishToPlatforms } from '../_lib/publisher';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { content, platforms, imageUrl } = req.body;

    if (!content || !platforms || !platforms.length) {
        return res.status(400).json({ error: 'content and platforms are required' });
    }

    try {
        const results = await publishToPlatforms(content, platforms, imageUrl);
        return res.status(200).json({ success: true, results });
    } catch (error: any) {
        console.error('Publishing error:', error);
        return res.status(500).json({ 
            error: 'Failed to publish post', 
            details: error?.message,
            stack: error?.stack
        });
    }
}
