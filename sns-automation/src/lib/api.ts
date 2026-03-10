import { Platform } from '../types';

export async function generateAIPostText(theme: string, message: string): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(
                `【${theme}】\n\n${message}\n\n#お知らせ #アップデート`
            );
        }, 1500); // モックの遅延
    });
}

export async function generateAIImage(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Unsplashのプレースホルダー画像を返す
            resolve(`https://source.unsplash.com/random/800x600/?${encodeURIComponent(prompt)}`);
        }, 2000);
    });
}

// バックエンドAPIを利用した本番投稿エンドポイント通信
export async function publishPost(content: string, platforms: Platform[], imageUrl: string | undefined): Promise<any> {
    const response = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, platforms, imageUrl })
    });

    if (!response.ok) {
        throw new Error('Failed to publish post');
    }

    return response.json();
}

// 予約投稿をバックエンドにスケジュールするエンドポイント通信
export async function schedulePost(content: string, platforms: Platform[], scheduledAt: string, imageUrl: string | undefined, postId: string): Promise<any> {
    const response = await fetch('/api/posts/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: postId, content, platforms, scheduledAt, imageUrl })
    });

    if (!response.ok) {
        throw new Error('Failed to schedule post');
    }

    return response.json();
}
