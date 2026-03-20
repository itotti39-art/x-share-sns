import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import cron from 'node-cron';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import { fal } from '@fal-ai/client';

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

// Fal.ai Client Configuration
fal.config({ credentials: process.env.FAL_KEY || '' });

// === Multer Configuration (Image Uploads) ===
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `img-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// === Auth Configuration ===
const authFile = path.join(process.cwd(), 'auth.json');
const defaultPassword = process.env.APP_PASSWORD || '0000';

function getPassword() {
    if (fs.existsSync(authFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(authFile, 'utf8'));
            if (data && data.password) {
                return data.password;
            }
        } catch (e) {
            console.error('Failed to read auth.json', e);
        }
    }
    return defaultPassword;
}

function setPassword(newPassword) {
    fs.writeFileSync(authFile, JSON.stringify({ password: newPassword }), 'utf8');
}

// パスワード認証エンドポイント
app.post('/api/auth/verify', (req, res) => {
    const { password } = req.body;
    const currentPassword = getPassword();
    if (password === currentPassword) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
});

// パスワード変更エンドポイント
app.post('/api/auth/change', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const actualPassword = getPassword();
    
    if (currentPassword !== actualPassword) {
        return res.status(401).json({ success: false, error: '現在のパスワードが間違っています' });
    }
    if (!newPassword || newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
        return res.status(400).json({ success: false, error: '新しいパスワードは4桁の数字で入力してください' });
    }
    
    setPassword(newPassword);
    res.json({ success: true });
});

// === Routes ===
app.use('/uploads', express.static(uploadDir));

// ルートパス (ブラウザアクセス確認用)
app.get('/', (req, res) => {
    res.send('SNS Automation API Server is running. Frontend is at http://localhost:5173');
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'SNS Automation API is running' });
});

// 画像アップロードエンドポイント
app.post('/api/posts/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }
    // const PORT = process.env.PORT || 3000;
    // URLは環境に依存するため、このアプリではそのまま返すかパスを返します。
    // 今回はローカルのフルパスとファイル名をフロントに返します
    const localPath = req.file.path;
    const imageUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${req.file.filename}`;

    res.json({ success: true, localPath, imageUrl });
});

// AI画像生成エンドポイント (Hugging Face FLUX.1-schnell)
app.post('/api/posts/generate-image', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        if (!process.env.HUGGINGFACE_TOKEN) {
            throw new Error('HUGGINGFACE_TOKEN is not configured');
        }

        // 日本語→英語の翻訳（MyMemory 無料API）
        let englishPrompt = prompt;
        try {
            const translateRes = await axios.get('https://api.mymemory.translated.net/get', {
                params: { q: prompt, langpair: 'ja|en' },
                timeout: 5000,
            });
            const translated = translateRes.data?.responseData?.translatedText;
            if (translated && translated !== prompt) {
                englishPrompt = translated;
                console.log(`[ImageGen] Translated: "${prompt}" → "${englishPrompt}"`);
            }
        } catch (translateErr) {
            console.warn('[ImageGen] Translation failed, using original prompt:', translateErr.message);
        }

        // Hugging Face Inference API に画像生成リクエスト（バイナリ返却）
        const hfResponse = await axios.post(
            'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell',
            { inputs: englishPrompt },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                    'Content-Type': 'application/json',
                    'Accept': 'image/jpeg',
                },
                responseType: 'arraybuffer',
                timeout: 60000,
            }
        );

        // レスポンスが画像でない場合はエラー
        const contentType = hfResponse.headers['content-type'] || '';
        if (!contentType.includes('image')) {
            const errText = Buffer.from(hfResponse.data).toString('utf-8');
            throw new Error(`HF API error: ${errText.substring(0, 200)}`);
        }

        // 画像バイナリをローカルに保存
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `ai-${uniqueSuffix}.jpg`;
        const localPath = path.join(uploadDir, filename);

        fs.writeFileSync(localPath, Buffer.from(hfResponse.data));

        const imageUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${filename}`;
        res.json({ success: true, localPath, imageUrl });
    } catch (error) {
        console.error('Image generation error:', error?.message || error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// SNS投稿エンドポイント
app.post('/api/posts/publish', async (req, res) => {
    const { content, platforms, imageUrl, localPath } = req.body;

    if (!content || !platforms || !platforms.length) {
        return res.status(400).json({ error: 'content and platforms are required' });
    }

    const results = {};

    try {
        // 1. X (Twitter) への投稿
        if (platforms.includes('x')) {
            if (process.env.TWITTER_API_KEY) {
                const rwClient = twitterClient.readWrite;
                try {
                    let mediaId;
                    if (localPath && fs.existsSync(localPath)) {
                        mediaId = await rwClient.v1.uploadMedia(localPath);
                    }

                    const tweetPayload = { text: content };
                    if (mediaId) {
                        tweetPayload.media = { media_ids: [mediaId] };
                    }

                    const tweet = await rwClient.v2.tweet(tweetPayload);
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
                    let fbRes;
                    if (localPath && fs.existsSync(localPath)) {
                        const form = new FormData();
                        form.append('message', content);
                        form.append('access_token', fbToken);
                        form.append('source', fs.createReadStream(localPath));

                        fbRes = await axios.post('https://graph.facebook.com/v19.0/me/photos', form, {
                            headers: form.getHeaders()
                        });
                    } else {
                        // Page Access Token を使って `/me/feed` に投稿すると、そのページとして投稿されます
                        fbRes = await axios.post('https://graph.facebook.com/v19.0/me/feed', {
                            message: content,
                            access_token: fbToken
                        });
                    }
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
                    let publicImageUrl = null;

                    // 画像あり: Imgur に画像をアップロードして公開URLを取得
                    if (localPath && fs.existsSync(localPath)) {
                        const imageData = fs.readFileSync(localPath);
                        const base64Image = imageData.toString('base64');

                        const imgurRes = await axios.post('https://api.imgur.com/3/image', {
                            image: base64Image,
                            type: 'base64',
                        }, {
                            // Imgur匿名アップロード用Client-ID
                            headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID || '546c25a59c58ad7'}` }
                        });
                        publicImageUrl = imgurRes.data?.data?.link;
                        console.log('[Threads] Imgur upload success:', publicImageUrl);
                    }

                    let createRes;
                    if (publicImageUrl) {
                        // 画像付き投稿 (IMAGE POST)
                        createRes = await axios.post(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, null, {
                            params: {
                                text: content,
                                media_type: 'IMAGE',
                                image_url: publicImageUrl,
                                access_token: threadsToken
                            }
                        });
                    } else {
                        // テキストのみ投稿 (TEXT POST)
                        createRes = await axios.post(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, null, {
                            params: {
                                text: content,
                                media_type: 'TEXT',
                                access_token: threadsToken
                            }
                        });
                    }
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
    const { id, content, platforms, imageUrl, localPath, scheduledAt } = req.body;

    if (!id || !content || !platforms || !scheduledAt) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    const post = {
        id,
        content,
        platforms,
        imageUrl,
        localPath,
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
                imageUrl: post.imageUrl,
                localPath: post.localPath
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

app.use((err, req, res, next) => { console.error('Unhandled Error:', err); res.status(500).send('Something broke!'); });
