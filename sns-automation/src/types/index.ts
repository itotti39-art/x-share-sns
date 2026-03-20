export type Platform = 'threads' | 'x' | 'facebook';
export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface AnalysisStats {
    views: number;
    likes: number;
    comments: number;
    shares: number;
}

export interface Post {
    id: string;
    prompt?: string;
    theme?: string;
    message?: string;
    content: string;
    imageUrl?: string;
    localPath?: string;
    platforms: Platform[];
    status: PostStatus;
    scheduledAt?: string;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    stats?: AnalysisStats;
}
