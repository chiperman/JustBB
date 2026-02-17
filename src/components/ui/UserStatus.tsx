'use client';

import { useState, useEffect, memo } from 'react';
import { logout, getCurrentUser } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UserInfo {
    id: string;
    email?: string;
    created_at: string;
    role?: string;
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
                        "flex items-center gap-2 p-2 bg-muted/40 rounded border border-border/50 group/status transition-all",
                        isCollapsed ? "justify-center" : "w-full"
                    )}
                    title={user.email || '用户'}
                >
                    <User className={cn("w-4 h-4 shrink-0", user.role === 'admin' ? "text-primary" : "text-muted-foreground")} />
                    {!isCollapsed && (
                        <span className="text-xs text-muted-foreground truncate flex-1 font-medium">
                            {user.email} {user.role === 'admin' ? '(管理员)' : '(普通用户)'}
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={cn(
                        "flex items-center justify-start gap-2 h-auto py-2.5 px-2.5 rounded hover:bg-accent text-muted-foreground font-normal",
                        isCollapsed ? "justify-center px-0 w-10 h-10" : "w-full",
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
                </Button>
            </div>
        );
    }

    return (
        <Link
            href="/"
            className={cn(
                "flex items-center gap-2 p-2.5 rounded hover:bg-accent transition-all text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                isCollapsed ? "justify-center" : "w-full"
            )}
            title={isCollapsed ? "管理员登录" : undefined}
        >
            <LogIn className="w-4 h-4" />
            {!isCollapsed && <span>管理员登录</span>}
        </Link>
    );
});
