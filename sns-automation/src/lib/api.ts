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
