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
        <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-sans text-slate-800">
            {/* Sidebar / Top Nav on mobile */}
            <aside className="w-full md:w-64 bg-indigo-900 text-white shadow-xl flex flex-col shrink-0 z-10 transition-all">
                <div className="p-4 md:p-6 flex items-center justify-between">
                    <h1 className="text-lg md:text-xl font-bold tracking-tight">SNS Auto Manager</h1>
                </div>
                <nav className="overflow-x-auto md:flex-1 md:mt-6 pb-3 md:pb-0 scrollbar-hide">
                    <ul className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 px-4 whitespace-nowrap">
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) =>
                                        clsx(
                                            'flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-colors text-sm md:text-base',
                                            isActive
                                                ? 'bg-indigo-800 text-white font-semibold'
                                                : 'text-indigo-200 hover:bg-indigo-800/50 hover:text-white'
                                        )
                                    }
                                >
                                    <item.icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
                <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-5xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
