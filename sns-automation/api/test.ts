import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        await import('./_lib/supabase.js');
        await import('./_lib/publisher.js');
        res.status(200).json({ status: 'ok', message: 'All modules loaded successfully!' });
    } catch (e: any) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
}
