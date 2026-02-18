'use client';

import { useState, useEffect, memo } from 'react';
import { logout } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const UserStatus = memo(function UserStatus({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const { user, loading, refreshUser } = useUser();
    const [loggingOut, setLoggingOut] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        await refreshUser();
        setLoggingOut(false);
        router.refresh();
    };

    return (
        <AnimatePresence mode="wait">
            {loading ? (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className={cn(
                        "space-y-2",
                        isCollapsed ? "flex flex-col items-center" : ""
                    )}
                >
                    <Skeleton className={cn("h-[34px] rounded border border-border/50", isCollapsed ? "w-8" : "w-full")} />
                    <Skeleton className={cn("h-[40px] rounded", isCollapsed ? "w-8" : "w-full")} />
                </motion.div>
            ) : user ? (
                <motion.div
                    key="user"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className={cn("space-y-2", isCollapsed ? "flex flex-col items-center" : "")}
                >
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
                        {!isCollapsed && <span>退出登录</span>}
                    </Button>
                </motion.div>
            ) : (
                <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full"
                >
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
                </motion.div>
            )}
        </AnimatePresence>
    );
});
