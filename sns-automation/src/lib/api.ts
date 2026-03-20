import { Platform } from '../types';
import { supabase } from './supabase';

export async function generateAIPostText(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(
                `【${prompt.substring(0, 20)}...】\n\nAIによる作成文例です。\n\n#お知らせ #アップデート`
            );
        }, 1500); // モックの遅延
    });
}

// AIでの画像生成
export async function generateAIPostImage(prompt: string): Promise<{ imageUrl: string; localPath: string }> {
    const response = await fetch('/api/posts/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        throw new Error('Failed to generate image');
    }

    return response.json();
}

// 今すぐ投稿
export async function publishPost(content: string, platforms: Platform[], imageUrl: string | undefined, localPath: string | undefined): Promise<any> {
    const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, platforms, imageUrl, localPath })
    });

    if (!response.ok) {
        throw new Error('Failed to publish post');
    }

    return response.json();
}

// 予約投稿
export async function schedulePost(content: string, platforms: Platform[], scheduledAt: string, imageUrl: string | undefined, localPath: string | undefined, postId: string): Promise<any> {
    const response = await fetch('/api/posts/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: postId, content, platforms, scheduledAt, imageUrl, localPath })
    });

    if (!response.ok) {
        throw new Error('Failed to schedule post');
    }

    return response.json();
}

// 画像をSupabase Storageへアップロード
export async function uploadImage(file: File): Promise<{ imageUrl: string; localPath: string }> {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

    const { error } = await supabase.storage
        .from('images')
        .upload(filename, file);

    if (error) {
        console.error('Supabase upload error:', error);
        throw new Error('Failed to upload image to Supabase');
    }

    const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filename);

    const imageUrl = publicUrlData.publicUrl;
    // クラウド移行後はlocalPathを使用しないため空文字を返す
    return { imageUrl, localPath: '' };
}

// パスワードの検証
export async function verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || '認証に失敗しました');
        }
        return await response.json();
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// パスワードの変更
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('/api/auth/change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'パスワードの変更に失敗しました');
        }
        return await response.json();
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
