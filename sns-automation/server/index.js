import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import cron from 'node-cron';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// X (Twitter) API Client Initialisation
// 実際の利用時には .env に有効なキーを設定してください
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY || '',
    appSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
});
const twitterBearer = new TwitterApi(process.env.TWITTER_BEARER_TOKEN || '');

// === Routes ===

// ルートパス (ブラウザアクセス確認用)
app.get('/', (req, res) => {
    res.send('SNS Automation API Server is running. Frontend is at http://localhost:5173');
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SNS Automation API is running' });
});

// SNS投稿エンドポイント
app.post('/api/posts/publish', async (req, res) => {
    const { content, platforms, imageUrl } = req.body;

    if (!content || !platforms || !platforms.length) {
        return res.status(400).json({ error: 'content and platforms are required' });
    }

    const results = {};

    try {
        // 1. X (Twitter) への投稿
        if (platforms.includes('x')) {
            if (process.env.TWITTER_API_KEY) {
                // v2 APIを用いたテキスト投稿の実装例
                const rwClient = twitterClient.readWrite;
                try {
                    const tweet = await rwClient.v2.tweet(content);
                    results.x = { success: true, id: tweet.data.id };
                } catch (err) {
                    console.error('X posting error:', err);
                    results.x = { success: false, error: err.message };
                }
            } else {
                results.x = { success: false, error: 'API Key is not configured' };
            }
        }

        // 2. Facebook への投稿
        if (platforms.includes('facebook')) {
            const fbToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
            if (fbToken) {
                try {
                    // Page Access Token を使って `/me/feed` に投稿すると、そのページとして投稿されます
                    const fbRes = await axios.post('https://graph.facebook.com/v19.0/me/feed', {
                        message: content,
                        access_token: fbToken
                    });
                    results.facebook = { success: true, id: fbRes.data.id };
                } catch (err) {
                    console.error('Facebook posting error:', err.response?.data || err.message);
                    results.facebook = { success: false, error: err.response?.data?.error?.message || err.message };
                }
            } else {
                results.facebook = { success: false, error: 'FACEBOOK_PAGE_ACCESS_TOKEN is not configured' };
            }
        }

        // 3. Threads への投稿
        if (platforms.includes('threads')) {
            const threadsToken = process.env.THREADS_ACCESS_TOKEN;
            const threadsUserId = process.env.THREADS_USER_ID || 'me';

            if (threadsToken) {
                try {
                    // ステップ1: メディアコンテナの作成 (テキスト投稿)
                    const createRes = await axios.post(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, null, {
                        params: {
                            text: content,
                            media_type: 'TEXT',
                            access_token: threadsToken
                        }
                    });
                    const creationId = createRes.data.id;

                    // ステップ2: 作成したコンテナの公開
                    const publishRes = await axios.post(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`, null, {
                        params: {
                            creation_id: creationId,
                            access_token: threadsToken
                        }
                    });

                    results.threads = { success: true, id: publishRes.data.id };
                } catch (err) {
                    console.error('Threads posting error:', err.response?.data || err.message);
                    results.threads = { success: false, error: err.response?.data?.error?.message || err.message };
                }
            } else {
                results.threads = { success: false, error: 'THREADS_ACCESS_TOKEN is not configured' };
            }
        }

        res.json({ success: true, results });

    } catch (error) {
        console.error('Publishing error:', error);
        res.status(500).json({ error: 'Failed to publish post' });
    }
});

// === 予約投稿の自動実行 (Cron Job) ===
// 本来はデータベースから予約を取得しますが、MVPのモックとして
// フロントエンドからリクエストを受け取ってメモリに保持する簡易実装とします
const scheduledPosts = [];
const completedPosts = []; // 完了した投稿IDを保持するリスト

app.get('/api/posts/status', (req, res) => {
    res.json({
        pending: scheduledPosts.map(p => p.id),
        completed: completedPosts
    });
});

app.post('/api/posts/schedule', (req, res) => {
    const { id, content, platforms, imageUrl, scheduledAt } = req.body;

    if (!id || !content || !platforms || !scheduledAt) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const post = {
        id,
        content,
        platforms,
        imageUrl,
        scheduledAt: new Date(scheduledAt),
    };

    scheduledPosts.push(post);
    console.log(`[Schedule] Post added for ${post.scheduledAt}`);

    res.json({ success: true, message: 'Post scheduled successfully' });
});

// 毎分実行して、時間が来た投稿を実際のAPIへ送信する
cron.schedule('* * * * *', async () => {
    console.log('[Cron] Checking for scheduled posts...');
    const now = new Date();

    // 実行するべき投稿を抽出
    const postsToPublish = scheduledPosts.filter(p => p.scheduledAt <= now);

    for (const post of postsToPublish) {
        console.log(`[Cron] Publishing scheduled post: ${post.id}`);
        try {
            // 本来は関数などを切り出しますが、ここでは簡略化のため自己APIを叩きます
            const res = await axios.post(`http://localhost:${PORT}/api/posts/publish`, {
                content: post.content,
                platforms: post.platforms,
                imageUrl: post.imageUrl
            });
            console.log(`[Cron] Successfully published post: ${post.id}`);

            // 完了リストへ追加
            completedPosts.push(post.id);

            // 実行済みをリストから削除
            const index = scheduledPosts.findIndex(p => p.id === post.id);
            if (index > -1) scheduledPosts.splice(index, 1);

        } catch (error) {
            console.error(`[Cron] Failed to publish post ${post.id}:`, error.message);
            // 失敗リストを追加する場合はここへ実装します（MVPでは保留）
            // 失敗してもリトライさせないためにリストから消去するかどうかは検討事項ですが、一旦そのまま保持します
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
