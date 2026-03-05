import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Image as ImageIcon, Send, Save, Loader2 } from 'lucide-react';
import { usePostStore } from '../stores/usePostStore';
import { Platform } from '../types';
import { generateAIPostText, generateAIImage } from '../lib/api';

export function CreatePost() {
    const navigate = useNavigate();
    const addPost = usePostStore((state) => state.addPost);

    const [theme, setTheme] = useState('');
    const [message, setMessage] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [platforms, setPlatforms] = useState<Platform[]>(['x']);
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');

    const handleGenerateText = async () => {
        if (!theme || !message) {
            alert('テーマと伝えたいことを入力してください');
            return;
        }
        setIsGeneratingText(true);
        try {
            const generated = await generateAIPostText(theme, message);
            setContent(generated);
        } catch (error) {
            console.error(error);
            alert('生成に失敗しました');
        } finally {
            setIsGeneratingText(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!theme) {
            alert('画像生成のプロンプトとしてテーマを入力してください');
            return;
        }
        setIsGeneratingImage(true);
        try {
            const url = await generateAIImage(theme);
            setImageUrl(url);
        } catch (error) {
            console.error(error);
            alert('画像生成に失敗しました');
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const togglePlatform = (p: Platform) => {
        setPlatforms((prev) =>
            prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
        );
    };

    const handleSaveDraft = () => {
        if (!content) {
            alert('投稿内容がありません');
            return;
        }
        addPost({
            theme,
            message,
            content,
            imageUrl,
            platforms,
            status: 'draft',
            scheduledAt: scheduledAt || undefined,
        });
        alert('下書きを保存しました');
        navigate('/posts');
    };

    const handleSchedulePost = () => {
        if (!content) {
            alert('投稿内容がありません');
            return;
        }
        if (!scheduledAt) {
            alert('予約日時を指定してください');
            return;
        }
        if (platforms.length === 0) {
            alert('投稿先プラットフォームを1つ以上選択してください');
            return;
        }
        addPost({
            theme,
            message,
            content,
            imageUrl,
            platforms,
            status: 'scheduled',
            scheduledAt,
        });
        alert('投稿を予約しました');
        navigate('/posts');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">新規投稿の作成</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側: 入力と生成 */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            投稿の要件
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">テーマ</label>
                                <input
                                    type="text"
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                    placeholder="例: 新機能リリースのお知らせ"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">伝えたいこと</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-h-[120px] resize-none"
                                    placeholder="例: ユーザーの要望が多かったダッシュボード機能を拡充しました。"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleGenerateText}
                                    disabled={isGeneratingText}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
                                >
                                    {isGeneratingText ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    AIで文章を生成
                                </button>
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-70"
                                >
                                    {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                                    AIで画像を生成
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 右側: プレビューと設定 */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">投稿プレビュー</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">投稿文 (編集可能)</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-h-[160px] resize-none whitespace-pre-wrap"
                                    placeholder="AIが生成したテキストがここに表示されます"
                                />
                            </div>

                            {imageUrl && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">添付画像</label>
                                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                        <img src={imageUrl} alt="Generated" className="w-full h-auto object-cover max-h-64" />
                                        <button
                                            onClick={() => setImageUrl('')}
                                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-md text-slate-600 hover:text-red-500 shadow-sm"
                                        >
                                            削除
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">配信設定</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">投稿先プラットフォーム</label>
                                <div className="flex gap-3">
                                    {(['threads', 'x', 'facebook'] as Platform[]).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => togglePlatform(p)}
                                            className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors capitalize ${platforms.includes(p)
                                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">予約日時</label>
                                <input
                                    type="datetime-local"
                                    value={scheduledAt}
                                    onChange={(e) => setScheduledAt(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button
                                    onClick={handleSaveDraft}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    <Save className="w-5 h-5" />
                                    下書き保存
                                </button>
                                <button
                                    onClick={handleSchedulePost}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                >
                                    <Send className="w-5 h-5" />
                                    予約投稿する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
