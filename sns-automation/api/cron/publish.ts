import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabase';
import { publishToPlatforms } from '../_lib/publisher';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Cron 認証チェック (Vercel Cronから呼び出される場合は自動付与される)
    // 開発時の手動実行用に、Authorization: Bearer CRON_SECRET も許容する
    const authHeader = req.headers.authorization;
    if (
        req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` &&
        req.query.secret !== process.env.CRON_SECRET // URLクエリからの手動トリガー用
    ) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log('[Cron] Checking for scheduled posts...');
        const now = new Date().toISOString();

        // 実行時刻を過ぎているpendingな投稿を取得
        const { data: postsToPublish, error: fetchError } = await supabaseAdmin
            .from('scheduled_posts')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_at', now);

        if (fetchError) {
            throw fetchError;
        }

        if (!postsToPublish || postsToPublish.length === 0) {
            console.log('[Cron] No pending posts found.');
            return res.status(200).json({ success: true, message: 'No pending posts' });
        }

        const publishedIds = [];
        const failedIds = [];

        for (const post of postsToPublish) {
            console.log(`[Cron] Publishing scheduled post: ${post.id}`);
            try {
                // SNS投稿処理の実行
                await publishToPlatforms(post.content, post.platforms, post.image_url);

                // ステータスをpublishedに更新
                await supabaseAdmin
                    .from('scheduled_posts')
                    .update({ status: 'published' })
                    .eq('id', post.id);

                publishedIds.push(post.id);
                console.log(`[Cron] Successfully published post: ${post.id}`);
            } catch (postError: any) {
                console.error(`[Cron] Failed to publish post ${post.id}:`, postError.message);
                
                // 失敗した場合はfailedに更新
                await supabaseAdmin
                    .from('scheduled_posts')
                    .update({ status: 'failed' })
                    .eq('id', post.id);

                failedIds.push(post.id);
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Cron job completed',
            publishedIds,
            failedIds
        });
    } catch (error: any) {
        console.error('[Cron] Error:', error);
        return res.status(500).json({ error: 'Failed to process scheduled posts' });
    }
}
