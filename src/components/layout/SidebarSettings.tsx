'use client';

import * as React from 'react';
import {
    Settings, User, Sun, Moon, Monitor, Type,
    LogOut, LogIn, Download, Loader2,
    ShieldCheck, UserCircle2
} from 'lucide-react';
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

interface SidebarSettingsProps {
    isCollapsed?: boolean;
}


export function SidebarSettings({ isCollapsed = false }: SidebarSettingsProps) {
    const { user, loading, refreshUser, isMounted } = useUser();
    const [loggingOut, setLoggingOut] = React.useState(false);
    const [isSans, setIsSans] = React.useState(false);
    const { setTheme } = useTheme();
    const router = useRouter();
    const { setViewMode } = useLoginMode();

    React.useEffect(() => {
        const savedFont = localStorage.getItem('font-preference');
        if (savedFont === 'sans') {
            setIsSans(true);
        }
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        await refreshUser();
        setLoggingOut(false);
        router.refresh();
    };

    const toggleFont = () => {
        const newVal = !isSans;
        setIsSans(newVal);
        if (newVal) {
            document.body.classList.add('font-sans');
            localStorage.setItem('font-preference', 'sans');
        } else {
            document.body.classList.remove('font-sans');
            localStorage.setItem('font-preference', 'serif');
        }
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
        // Hydration 防御：在挂载前显示静默状态，避免 SSR 不匹配
        if (!isMounted) return <UserCircle2 className="w-4 h-4 text-muted-foreground" />;

        // 如果有缓存的用户数据，优先显示身份图标而不是加载状态
        if (user?.role === 'admin') return <ShieldCheck className="w-4 h-4 text-primary" />;
        if (user) return <User className="w-4 h-4 text-muted-foreground" />;
        if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
        return <UserCircle2 className="w-4 h-4 text-muted-foreground" />;
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full flex items-center gap-3 h-9 p-2 hover:bg-accent hover:text-accent-foreground rounded-sm transition-all focus-visible:ring-0 group/settings",
                            isCollapsed ? "justify-center" : "justify-start px-3"
                        )}
                        aria-label="账号与设置"
                    >
                        <div className="relative shrink-0">
                            <Settings className="size-4 text-muted-foreground group-hover/settings:text-primary transition-colors" />
                            {/* 状态小圆点提示 - 仅在挂载后且有用户时显示 */}
                            {isMounted && user && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-background bg-primary" />
                            )}
                        </div>

                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0, x: -10 }}
                                    animate={{ opacity: 1, width: "auto", x: 0 }}
                                    exit={{ opacity: 0, width: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-start overflow-hidden whitespace-nowrap"
                                >
                                    <span className="text-[14px] font-normal text-foreground">设置中心</span>
                                    <span className="text-[12px] font-normal text-stone-400 truncate w-full flex items-center gap-1">
                                        {!isMounted ? '...' : (user ? user.email : (loading ? '加载中...' : '未登录/匿名'))}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-64 rounded-sm border-border/40 backdrop-blur-md bg-popover/90 p-1 shadow-2xl">
                    <DropdownMenuLabel className="font-normal px-3 py-3">
                        <div className="flex flex-col space-y-2">
                            <p className="text-[12px] font-normal text-stone-400 uppercase tracking-wider font-sans opacity-60">Identity / 身份</p>
                            <div className="flex items-center gap-2.5">
                                <div className={cn(
                                    "p-2 rounded-sm",
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
                            <DropdownMenuSubTrigger className="rounded-sm">
                                <Sun className="mr-2 h-4 w-4" />
                                <span>外观主题</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="rounded-sm ml-1">
                                    <DropdownMenuItem className="rounded-sm" onClick={() => setTheme('light')}>
                                        <Sun className="mr-2 h-4 w-4" />
                                        <span>浅色模式</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-sm" onClick={() => setTheme('dark')}>
                                        <Moon className="mr-2 h-4 w-4" />
                                        <span>深色模式</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-sm" onClick={() => setTheme('system')}>
                                        <Monitor className="mr-2 h-4 w-4" />
                                        <span>跟随系统</span>
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuItem className="rounded-sm" onClick={toggleFont}>
                            <Type className="mr-2 h-4 w-4" />
                            <span>字体风格: {isSans ? '无衬线' : '经典衬线'}</span>
                        </DropdownMenuItem>
                    </div>



                    <DropdownMenuSeparator className="opacity-50" />

                    {/* 工具区 */}
                    <div className="px-1 py-1">
                        <p className="px-2 py-1.5 text-[12px] font-medium text-stone-400 uppercase tracking-wider font-sans">Tools / 工具</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    className="rounded-sm disabled:opacity-40"
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={user?.role !== 'admin'}
                                    title={user?.role !== 'admin' ? "仅管理员可导出数据" : undefined}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>备份全站记录 (MD)</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-sm border-border/50">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-primary">
                                        <Download className="w-5 h-5" />
                                        确认导出数据？
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        系统将处理所有公开及私密记录，生成一个标准的 Markdown 格式备份，请妥善保管。
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-sm">暂不导出</AlertDialogCancel>
                                    <AlertDialogAction className="rounded-sm" onClick={handleExport}>
                                        立即执行导出
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <DropdownMenuSeparator className="opacity-50" />

                    {/* 操作区 */}
                    <div className="px-1 py-1">
                        {!user && (
                            <>
                                <DropdownMenuItem className="rounded-sm" onClick={() => {
                                    setViewMode('CARD_VIEW');
                                }}>
                                    <LogIn className="mr-2 h-4 w-4 text-primary" />
                                    <span>登录系统</span>
                                </DropdownMenuItem>
                            </>
                        )}

                        {user && (
                            <DropdownMenuItem
                                className="rounded-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={handleLogout}
                                disabled={loggingOut}
                            >
                                {loggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                <span>退出登录</span>
                            </DropdownMenuItem>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

        </>
    );
}
