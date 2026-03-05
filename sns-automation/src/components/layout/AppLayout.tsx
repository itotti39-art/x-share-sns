import { Outlet, NavLink } from 'react-router-dom';
import { Home, List, PenSquare, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';

export function AppLayout() {
    const navItems = [
        { to: '/', icon: Home, label: 'ダッシュボード' },
        { to: '/posts', icon: List, label: '投稿管理' },
        { to: '/create', icon: PenSquare, label: '新規投稿' },
        { to: '/settings', icon: SettingsIcon, label: 'アカウント設定' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
            {/* Sidebar */}
            <aside className="w-64 bg-indigo-900 text-white shadow-xl flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight">SNS Auto Manager</h1>
                </div>
                <nav className="flex-1 mt-6">
                    <ul className="space-y-2 px-4">
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-indigo-800 text-white'
                                                : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
                                        )
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
                <div className="container mx-auto px-6 py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
