'use client';

import { useState, useEffect, memo } from 'react';
import { logout, getCurrentUser } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserInfo {
    id: string;
    email?: string;
    created_at: string;
}

export const UserStatus = memo(function UserStatus({ isCollapsed = false }: { isCollapsed?: boolean }) {
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
            <div className={cn(
                "flex items-center gap-2 p-2 text-muted-foreground animate-pulse",
                isCollapsed ? "justify-center" : ""
            )} role="status" aria-label="正在获取登录状态">
                <Loader2 className="w-4 h-4 animate-spin" />
                {!isCollapsed && <span className="text-xs">加载中...</span>}
            </div>
        );
    }

    if (user) {
        return (
            <div className={cn("space-y-2", isCollapsed ? "flex flex-col items-center" : "")}>
                <div
                    className={cn(
                        "flex items-center gap-2 p-2 bg-muted/40 rounded-xl border border-border/50 group/status transition-all",
                        isCollapsed ? "justify-center" : "w-full"
                    )}
                    title={user.email || '管理员'}
                >
                    <User className="w-4 h-4 text-primary shrink-0" />
                    {!isCollapsed && (
                        <span className="text-xs text-muted-foreground truncate flex-1 font-medium">
                            {user.email || '管理员'}
                        </span>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={cn(
                        "flex items-center gap-2 p-2.5 rounded-xl hover:bg-muted transition-all text-sm text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                        isCollapsed ? "justify-center" : "w-full",
                        loggingOut && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="退出登录"
                    title={isCollapsed ? "退出登录" : undefined}
                >
                    {loggingOut ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <LogOut className="w-4 h-4" />
                    )}
                    {!isCollapsed && <span>登出系统</span>}
                </button>
            </div>
        );
    }

    return (
        <Link
            href="/admin/login"
            className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl hover:bg-muted transition-all text-sm text-muted-foreground hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                isCollapsed ? "justify-center" : "w-full"
            )}
            title={isCollapsed ? "管理员登录" : undefined}
        >
            <LogIn className="w-4 h-4" />
            {!isCollapsed && <span>管理员登录</span>}
        </Link>
    );
});
