import { useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Platform } from '../types';
import { Settings as SettingsIcon, Link as LinkIcon, Unlink, AlertCircle } from 'lucide-react';

export function Settings() {
    const { accounts, connectAccount, disconnectAccount } = useSettingsStore();
    const [isConnecting, setIsConnecting] = useState<Platform | null>(null);

    const handleConnect = (platform: Platform) => {
        setIsConnecting(platform);
        setTimeout(() => {
            const mockNames = {
                x: '@user_x',
                facebook: 'Facebook Page',
                threads: '@user_threads',
            };
            connectAccount(platform, mockNames[platform]);
            setIsConnecting(null);
        }, 1500);
    };

    const platforms: { id: Platform; name: string; color: string }[] = [
        { id: 'x', name: 'X (Twitter)', color: 'bg-slate-900' },
        { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
        { id: 'threads', name: 'Threads', color: 'bg-neutral-900' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <SettingsIcon className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">連携アカウント設定</h1>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium">API連携について</p>
                    <p className="mt-1 opacity-90">
                        各SNSプロバイダーのOAuth認証を利用して安全にログインします。パスワードなどの認証情報がこのアプリに直接保存されることはありません。
                        （※現在はデモンストレーション用のモックとして動作します）
                    </p>
                </div>
            </div>

            <div className="grid gap-4">
                {platforms.map((p) => {
                    const account = accounts[p.id];
                    const isConnected = account?.isConnected;

                    return (
                        <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${p.color}`}>
                                    <span className="font-bold text-lg">{p.name[0]}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{p.name}</h3>
                                    {isConnected ? (
                                        <p className="text-sm text-emerald-600 font-medium mt-1 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            連携済み ({account.accountName})
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-500 mt-1">未連携</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                {isConnected ? (
                                    <button
                                        onClick={() => disconnectAccount(p.id)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
                                    >
                                        <Unlink className="w-4 h-4" />
                                        連携解除
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleConnect(p.id)}
                                        disabled={isConnecting !== null}
                                        className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                                    >
                                        {isConnecting === p.id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                連携中...
                                            </>
                                        ) : (
                                            <>
                                                <LinkIcon className="w-4 h-4" />
                                                連携する
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
