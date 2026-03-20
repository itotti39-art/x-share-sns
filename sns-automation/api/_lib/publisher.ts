import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';

export async function publishToPlatforms(content: string, platforms: string[], imageUrl: string | undefined | null) {
    const results: any = {};

    // 1. X (Twitter) への投稿
    if (platforms.includes('x')) {
        if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET && process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_SECRET) {
            const twitterClient = new TwitterApi({
                appKey: process.env.TWITTER_API_KEY,
                appSecret: process.env.TWITTER_API_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_SECRET,
            });
            const rwClient = twitterClient.readWrite;

            try {
                let mediaId;
                if (imageUrl) {
                    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(imageResponse.data, 'binary');
                    const mimeType = 'image/jpeg'; 
                    mediaId = await rwClient.v1.uploadMedia(buffer, { mimeType });
                }

                const tweetPayload: any = { text: content };
                if (mediaId) {
                    tweetPayload.media = { media_ids: [mediaId] };
                }

                const tweet = await rwClient.v2.tweet(tweetPayload);
                results.x = { success: true, id: tweet.data.id };
            } catch (err: any) {
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
                if (imageUrl) {
                    fbRes = await axios.post('https://graph.facebook.com/v19.0/me/photos', {
                        message: content,
                        url: imageUrl,
                        access_token: fbToken
                    });
                } else {
                    fbRes = await axios.post('https://graph.facebook.com/v19.0/me/feed', {
                        message: content,
                        access_token: fbToken
                    });
                }
                results.facebook = { success: true, id: fbRes.data.id };
            } catch (err: any) {
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
                let createRes;
                if (imageUrl) {
                    createRes = await axios.post(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, null, {
                        params: {
                            text: content,
                            media_type: 'IMAGE',
                            image_url: imageUrl,
                            access_token: threadsToken
                        }
                    });
                } else {
                    createRes = await axios.post(`https://graph.threads.net/v1.0/${threadsUserId}/threads`, null, {
                        params: {
                            text: content,
                            media_type: 'TEXT',
                            access_token: threadsToken
                        }
                    });
                }
                const creationId = createRes.data.id;

                const publishRes = await axios.post(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`, null, {
                    params: {
                        creation_id: creationId,
                        access_token: threadsToken
                    }
                });

                results.threads = { success: true, id: publishRes.data.id };
            } catch (err: any) {
                console.error('Threads posting error:', err.response?.data || err.message);
                results.threads = { success: false, error: err.response?.data?.error?.message || err.message };
            }
        } else {
            results.threads = { success: false, error: 'THREADS_ACCESS_TOKEN is not configured' };
        }
    }

    return results;
}
