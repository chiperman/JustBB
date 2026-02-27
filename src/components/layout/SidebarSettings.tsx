'use client';

import * as React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Settings02Icon as Settings,
    UserIcon as User,
    Sun01Icon as Sun,
    Moon01Icon as Moon,
    ComputerIcon as Monitor,
    TextFontIcon as Type,
    Logout02Icon as LogOut,
    Login03Icon as LogIn,
    Download02Icon as Download,
    Loading01Icon as Loader2,
    ShieldCheck,
    UserCircleIcon as UserCircle,
    CheckListIcon
} from '@hugeicons/core-free-icons';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { logout } from '@/actions/auth';
import { cn } from '@/lib/utils';
import { useLoginMode } from '@/context/LoginModeContext';
import { useUser } from '@/context/UserContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { UsageModal } from '@/components/admin/UsageModal';

interface SidebarSettingsProps {
    isCollapsed?: boolean;
}


export function SidebarSettings({ isCollapsed = false }: SidebarSettingsProps) {
    const { user, loading, refreshUser } = useUser();
    const { setViewMode } = useLoginMode();
    const { setTheme } = useTheme();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = React.useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        await refreshUser();
        setLoggingOut(false);
        router.refresh();
    };


    const handleExport = async () => {
        const { exportMemos } = await import('@/actions/export');
        const data = await exportMemos('markdown');
        const blob = new Blob([data], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `JustMemo-Export-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
    };

    // 身份显示逻辑容器
    const renderIdentity = () => {
        // 如果有缓存的用户数据，优先显示身份图标而不是加载状态
        if (user?.role === 'admin') return <HugeiconsIcon icon={ShieldCheck} size={16} className="text-primary" />;
        if (user) return <HugeiconsIcon icon={User} size={16} className="text-muted-foreground" />;
        if (loading && !user) return <HugeiconsIcon icon={Loader2} size={16} className="animate-spin text-muted-foreground" />;
        return <HugeiconsIcon icon={UserCircle} size={16} className="text-muted-foreground" />;
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full flex items-center gap-3 h-9 p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-all focus-visible:ring-0 group/settings overflow-hidden",
                            isCollapsed ? "justify-center" : "justify-start px-3"
                        )}
                        aria-label="账号与设置"
                    >
                        <div className="relative shrink-0">
                            <HugeiconsIcon icon={Settings} size={16} className="text-muted-foreground transition-colors" />
                            {/* 状态小圆点提示 - 有用户时立即显示 */}
                            {user && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-background bg-primary" />
                            )}
                        </div>

                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    key="content"
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-start overflow-hidden whitespace-nowrap flex-1"
                                >
                                    <span
                                        className="text-[14px] font-normal text-foreground truncate w-full flex items-center gap-1"
                                        suppressHydrationWarning
                                    >
                                        {user ? user.email : (loading ? '加载中...' : '未登录')}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-64 rounded-md border-border/40 backdrop-blur-md bg-popover/90 p-1 shadow-xl">
                    <DropdownMenuLabel className="font-normal px-3 py-3">
                        <div className="flex flex-col space-y-2">
                            <p className="text-[12px] font-normal text-stone-400 uppercase tracking-wider font-sans opacity-60">Identity / 身份</p>
                            <div className="flex items-center gap-2.5">
                                <div className={cn(
                                    "p-2 rounded-md",
                                    user ? "bg-primary/10" : "bg-muted"
                                )}>
                                    {renderIdentity()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-normal truncate leading-none">
                                        {user ? (user.role === 'admin' ? "正式管理员" : "普通用户") : "匿名身份"}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                                        {user ? user.email : "当前仅可查看公开内容"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="opacity-50" />

                    {/* 视觉与偏好 */}
                    <div className="px-1 py-1">
                        <DropdownMenuLabel className="px-2 py-1.5 text-[12px] font-normal text-stone-400 uppercase tracking-wider font-sans">Settings / 偏好</DropdownMenuLabel>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="rounded-md">
                                <HugeiconsIcon icon={Sun} size={16} className="mr-2" />
                                <span>外观主题</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="rounded-md ml-1">
                                    <DropdownMenuItem className="rounded-md" onClick={() => setTheme('light')}>
                                        <HugeiconsIcon icon={Sun} size={16} className="mr-2" />
                                        <span>浅色模式</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-md" onClick={() => setTheme('dark')}>
                                        <HugeiconsIcon icon={Moon} size={16} className="mr-2" />
                                        <span>深色模式</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-md" onClick={() => setTheme('system')}>
                                        <HugeiconsIcon icon={Monitor} size={16} className="mr-2" />
                                        <span>跟随系统</span>
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                    </div>



                    <DropdownMenuSeparator className="opacity-50" />

                    {/* 工具区 */}
                    <div className="px-1 py-1">
                        <p className="px-2 py-1.5 text-[12px] font-medium text-stone-400 uppercase tracking-wider font-sans">Tools / 工具</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    className="rounded-md disabled:opacity-40"
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={user?.role !== 'admin'}
                                    title={user?.role !== 'admin' ? "仅管理员可导出数据" : undefined}
                                >
                                    <HugeiconsIcon icon={Download} size={16} className="mr-2" />
                                    <span>备份全站记录 (MD)</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-md border-border/50">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-primary">
                                        <HugeiconsIcon icon={Download} size={20} />
                                        确认导出数据？
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        系统将处理所有公开及私密记录，生成一个标准的 Markdown 格式备份，请妥善保管。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-md">暂不导出</AlertDialogCancel>
                                    <AlertDialogAction className="rounded-md" onClick={handleExport}>
                                        立即执行导出
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {user?.role === 'admin' && (
                            <UsageModal
                                trigger={
                                    <DropdownMenuItem className="rounded-md" onSelect={(e) => e.preventDefault()}>
                                        <HugeiconsIcon icon={CheckListIcon} size={16} className="mr-2" />
                                        <span>服务用量监控</span>
                                    </DropdownMenuItem>
                                }
                            />
                        )}
                    </div>

                    <DropdownMenuSeparator className="opacity-50" />

                    {/* 操作区 */}
                    <div className="px-1 py-1">
                        {!user && (
                            <>
                                <DropdownMenuItem className="rounded-md" onClick={() => {
                                    setViewMode('CARD_VIEW');
                                }}>
                                    <HugeiconsIcon icon={LogIn} size={16} className="mr-2 text-primary" />
                                    <span>登录系统</span>
                                </DropdownMenuItem>
                            </>
                        )}

                        {user && (
                            <DropdownMenuItem
                                className="rounded-md text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={handleLogout}
                                disabled={loggingOut}
                            >
                                <HugeiconsIcon icon={loggingOut ? Loader2 : LogOut} size={16} className={cn("mr-2", loggingOut && "animate-spin")} />
                                <span>退出登录</span>
                            </DropdownMenuItem>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

        </>
    );
}
