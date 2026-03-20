import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { verifyPassword } from '../lib/api';
import { Lock, Loader2 } from 'lucide-react';

export function Login() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!password || password.length !== 4) {
            setError('4桁のパスワードを入力してください');
            return;
        }

        setError('');
        setIsLoading(true);

        const res = await verifyPassword(password);
        if (res.success) {
            login();
            navigate('/', { replace: true });
        } else {
            setError(res.error || 'パスワードが間違っています');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="flex flex-col items-center justify-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">ログイン</h1>
                    <p className="text-slate-500 mt-2 text-center">アクセスには4桁のパスワードが必要です。<br />初期設定は 0000 です。</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                            パスワード (4桁)
                        </label>
                        <input
                            id="password"
                            type="password"
                            maxLength={4}
                            pattern="\d{4}"
                            inputMode="numeric"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-center text-3xl tracking-widest px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="****"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || password.length !== 4}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ログイン'}
                    </button>
                </form>
            </div>
        </div>
    );
}
