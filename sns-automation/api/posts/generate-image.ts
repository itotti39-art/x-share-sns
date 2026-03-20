import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { supabaseAdmin } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        if (!process.env.HUGGINGFACE_TOKEN) {
            throw new Error('HUGGINGFACE_TOKEN is not configured');
        }

        // 1. 日本語→英語の翻訳（MyMemory 無料API）
        let englishPrompt = prompt;
        try {
            const translateRes = await axios.get('https://api.mymemory.translated.net/get', {
                params: { q: prompt, langpair: 'ja|en' },
                timeout: 5000,
            });
            const translated = translateRes.data?.responseData?.translatedText;
            if (translated && translated !== prompt) {
                englishPrompt = translated;
                console.log(`[ImageGen] Translated: "${prompt}" -> "${englishPrompt}"`);
            }
        } catch (translateErr: any) {
            console.warn('[ImageGen] Translation failed, using original prompt:', translateErr.message);
        }

        // 2. Hugging Face Inference API に画像生成リクエスト（バイナリ返却）
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

        const contentType = hfResponse.headers['content-type'] || '';
        if (!contentType.includes('image')) {
            const errText = Buffer.from(hfResponse.data).toString('utf-8');
            throw new Error(`HF API error: ${errText.substring(0, 200)}`);
        }

        // 3. 取得した画像をバイナリとして Supabase Storage に直接アップロード
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `ai-${uniqueSuffix}.jpg`;
        const imageBuffer = Buffer.from(hfResponse.data);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('images')
            .upload(filename, imageBuffer, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error('Failed to upload image to Supabase');
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from('images')
            .getPublicUrl(filename);

        const imageUrl = publicUrlData.publicUrl;

        // フロントエンドの互換性のため localPath: '' を返す
        res.status(200).json({ success: true, localPath: '', imageUrl });
    } catch (error: any) {
        console.error('Image generation error:', error?.message || error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
}
