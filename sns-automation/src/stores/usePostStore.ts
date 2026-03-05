import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Post, PostStatus } from '../types';

interface PostState {
    posts: Post[];
    addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updatePost: (id: string, post: Partial<Post>) => void;
    deletePost: (id: string) => void;
    updateStatus: (id: string, status: PostStatus) => void;
}

export const usePostStore = create<PostState>()(
    persist(
        (set) => ({
            posts: [],
            addPost: (post) =>
                set((state) => {
                    const newPost: Post = {
                        ...post,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    return { posts: [newPost, ...state.posts] };
                }),
            updatePost: (id, updatedFields) =>
                set((state) => ({
                    posts: state.posts.map((post) =>
                        post.id === id
                            ? { ...post, ...updatedFields, updatedAt: new Date().toISOString() }
                            : post
                    ),
                })),
            deletePost: (id) =>
                set((state) => ({
                    posts: state.posts.filter((post) => post.id !== id),
                })),
            updateStatus: (id, status) =>
                set((state) => ({
                    posts: state.posts.map((post) =>
                        post.id === id
                            ? { ...post, status, updatedAt: new Date().toISOString() }
                            : post
                    ),
                })),
        }),
        {
            name: 'sns-automation-storage',
        }
    )
);
