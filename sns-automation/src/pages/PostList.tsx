import { useEffect } from 'react';
import { usePostStore } from '../stores/usePostStore';
import { formatDate } from '../lib/date';
import { RefreshCw, Trash2, Edit2, Play, Circle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { PostStatus } from '../types';

export function PostList() {
    const { posts, updateStatus, deletePost } = usePostStore();

    // 予約投稿のステータスをサーバーと同期する
    useEffect(() => {
        const checkStatus = async () => {
            // 予約中の投稿があるか確認
            const hasScheduled = posts.some(p => p.status === 'scheduled');
            if (!hasScheduled) return;

            try {
                const res = await fetch('/api/posts/status');
                if (!res.ok) return;
                const data = await res.json();

                posts.forEach(post => {
                    if (post.status === 'scheduled' && data.completed.includes(post.id)) {
                        updateStatus(post.id, 'published');
                    }
                });
            } catch (err) {
                console.error('Failed to fetch post status:', err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 15000); // 15秒ごとに確認

        return () => clearInterval(interval);
    }, [posts, updateStatus]);

    const handleStatusChange = (id: string, currentStatus: PostStatus) => {
        // 状態をモックで切り替える機能（下書き -> 予約 -> 公開）
        const nextStatus: Record<PostStatus, PostStatus> = {
            draft: 'scheduled',
            scheduled: 'published',
            published: 'draft',
        };
        updateStatus(id, nextStatus[currentStatus]);
    };

    const getStatusBadge = (status: PostStatus) => {
        switch (status) {
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <Circle className="w-3 h-3" />
                        下書き
                    </span>
                );
            case 'scheduled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        <RefreshCw className="w-3 h-3" />
                        予約済み
                    </span>
                );
            case 'published':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        公開完了
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">投稿管理</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 font-medium text-slate-500 text-sm w-1/3">投稿内容</th>
                                <th className="px-6 py-4 font-medium text-slate-500 text-sm">プラットフォーム</th>
                                <th className="px-6 py-4 font-medium text-slate-500 text-sm">ステータス</th>
                                <th className="px-6 py-4 font-medium text-slate-500 text-sm">予定日時</th>
                                <th className="px-6 py-4 font-medium text-slate-500 text-sm text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {posts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <p className="text-base font-medium">投稿がありません</p>
                                        <p className="text-sm mt-1">新規投稿から作成してください</p>
                                    </td>
                                </tr>
                            ) : (
                                posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                {post.imageUrl && (
                                                    <img src={post.imageUrl} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-800 line-clamp-1">{post.prompt || post.theme || '(テーマなし)'}</p>
                                                    <p className="text-sm text-slate-500 line-clamp-2 mt-1 whitespace-pre-line">
                                                        {post.content}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1.5 flex-wrap">
                                                {post.platforms.map((p) => (
                                                    <span key={p} className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(post.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600">
                                                {post.scheduledAt ? formatDate(post.scheduledAt) : '未設定'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleStatusChange(post.id, post.status)}
                                                    className={clsx(
                                                        "p-2 rounded-lg transition-colors group relative",
                                                        post.status === 'scheduled' ? "text-indigo-600 hover:bg-indigo-50" : "text-emerald-600 hover:bg-emerald-50"
                                                    )}
                                                    title="ステータス変更"
                                                >
                                                    <Play className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="編集"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('この投稿を削除しますか？')) {
                                                            deletePost(post.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="削除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
