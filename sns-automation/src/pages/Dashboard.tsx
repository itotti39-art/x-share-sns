import { ArrowUpRight, BarChart3, Heart, MessageCircle, Share2, Users } from 'lucide-react';
import { usePostStore } from '../stores/usePostStore';
import { formatDate } from '../lib/date';
import clsx from 'clsx';
import { Post } from '../types';

export function Dashboard() {
    const { posts } = usePostStore();

    // モック分析データ
    const metrics = [
        { label: '総表示数', value: '45,231', change: '+12.5%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: '総いいね', value: '4,210', change: '+8.2%', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: '総コメント', value: '384', change: '-2.4%', icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: '総シェア', value: '1,204', change: '+15.3%', icon: Share2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    // 公開済みの投稿のみ表示
    const publishedPosts = posts.filter(p => p.status === 'published');
    // ランキング用にモックでランダムにソート
    const ranking = [...publishedPosts].sort(() => Math.random() - 0.5).slice(0, 5);
    // 最近の投稿
    const recent = [...posts].slice(0, 5);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stats Cards */}
                {metrics.map((m) => (
                    <div key={m.label} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div className={clsx("p-3 rounded-xl", m.bg)}>
                                <m.icon className={clsx("w-6 h-6", m.color)} />
                            </div>
                            <span className={clsx("flex items-center text-xs font-semibold px-2 py-1 rounded-full",
                                m.change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            )}>
                                <ArrowUpRight className={clsx("w-3 h-3 mr-1", m.change.startsWith('+') ? "" : "rotate-90")} />
                                {m.change.replace(/[+-]/, '')}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-sm font-medium text-slate-500">{m.label}</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{m.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                            伸びた投稿ランキング
                        </h2>
                    </div>
                    <div className="p-0">
                        {ranking.length === 0 ? (
                            <p className="text-slate-500 text-sm p-6 text-center">公開済みの投稿がありません</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {ranking.map((post, idx) => (
                                    <PostListItem key={post.id} post={post} rank={idx + 1} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-indigo-500" />
                            最近の投稿
                        </h2>
                        <a href="/posts" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">すべて見る</a>
                    </div>
                    <div className="p-0">
                        {recent.length === 0 ? (
                            <p className="text-slate-500 text-sm p-6 text-center">投稿がありません</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {recent.map((post) => (
                                    <PostListItem key={post.id} post={post} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 内部コンポーネントとしてのリストアイテム
function PostListItem({ post, rank }: { post: Post, rank?: number }) {
    return (
        <li className="p-6 hover:bg-slate-50 transition-colors flex items-start gap-4">
            {rank !== undefined && (
                <span className={clsx(
                    "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0",
                    rank === 1 ? "bg-amber-100 text-amber-600" :
                        rank === 2 ? "bg-slate-200 text-slate-600" :
                            rank === 3 ? "bg-orange-100 text-orange-600" :
                                "bg-slate-100 text-slate-500"
                )}>
                    {rank}
                </span>
            )}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 line-clamp-1">{post.theme || 'テーマなし'}</p>
                <p className="text-sm text-slate-500 line-clamp-1 mt-1">{post.content}</p>
                <div className="flex gap-4 mt-3 text-xs text-slate-400 font-medium">
                    <span>{formatDate(post.createdAt)}</span>
                    {post.status === 'published' ? (
                        <span className="text-emerald-500">● 公開済み</span>
                    ) : post.status === 'scheduled' ? (
                        <span className="text-indigo-500">● 予約済み</span>
                    ) : (
                        <span className="text-slate-500">● 下書き</span>
                    )}
                </div>
            </div>
            {post.imageUrl && (
                <img src={post.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-200" />
            )}
        </li>
    );
}
