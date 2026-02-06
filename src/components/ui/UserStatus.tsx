'use client';

import { useState, useEffect } from 'react';
import { logout, getCurrentUser } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, User, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface UserInfo {
    id: string;
    email?: string;
    created_at: string;
}

export function UserStatus() {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const router = useRouter();

    useEffect(() => {
        getCurrentUser().then((u) => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        setUser(null);
        setLoggingOut(false);
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">加载中...</span>
            </div>
        );
    }

    if (user) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground truncate flex-1">
                        {user.email || '管理员'}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted transition-all text-sm text-muted-foreground hover:text-foreground"
                >
                    {loggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <LogOut className="w-4 h-4" />
                    )}
                    <span>登出</span>
                </button>
            </div>
        );
    }

    return (
        <Link
            href="/admin/login"
            className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted transition-all text-sm text-muted-foreground hover:text-foreground"
        >
            <LogIn className="w-4 h-4" />
            <span>管理员登录</span>
        </Link>
    );
}
