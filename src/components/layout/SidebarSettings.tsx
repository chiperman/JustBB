'use client';

import * as React from 'react';
import {
    Settings, User, Sun, Moon, Monitor, Type,
    LogOut, LogIn, Download, Loader2, Lock,
    Unlock, ShieldCheck, UserCircle2
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { logout, getCurrentUser } from '@/actions/auth';
import { clearUnlockCode } from '@/actions/unlock';
import { cn } from '@/lib/utils';
import { useLoginMode } from '@/context/LoginModeContext';
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
import { UnlockDialog } from '@/components/ui/UnlockDialog';

interface SidebarSettingsProps {
    isCollapsed?: boolean;
}

interface UserInfo {
    id: string;
    email?: string;
    created_at: string;
}

export function SidebarSettings({ isCollapsed = false }: SidebarSettingsProps) {
    const [user, setUser] = React.useState<UserInfo | null>(null);
    const [isGuest, setIsGuest] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [loggingOut, setLoggingOut] = React.useState(false);
    const [isSans, setIsSans] = React.useState(false);
    const [isUnlockOpen, setIsUnlockOpen] = React.useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { setViewMode } = useLoginMode();

    React.useEffect(() => {
        // 获取管理员状态和访客状态
        const checkAuth = async () => {
            const u = await getCurrentUser();
            setUser(u);

            // 简单的访客状态判断：检查是否存在特定的 cookie
            // 在 Client 组件中，我们可以通过 document.cookie 简单检测
            const hasAccessCode = document.cookie.includes('memo_access_code=');
            setIsGuest(hasAccessCode);

            setLoading(false);
        };

        checkAuth();

        const savedFont = localStorage.getItem('font-preference');
        if (savedFont === 'sans') {
            setIsSans(true);
        }
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout();
        setUser(null);
        setLoggingOut(false);
        router.refresh();
    };

    const handleClearGuest = async () => {
        await clearUnlockCode();
        setIsGuest(false);
        window.location.reload();
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
        a.download = `justbb_export_${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
    };

    // 身份显示逻辑容器
    const renderIdentity = () => {
        if (loading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
        if (user) return <ShieldCheck className="w-4 h-4 text-primary" />;
        if (isGuest) return <Unlock className="w-4 h-4 text-amber-500" />;
        return <UserCircle2 className="w-4 h-4 text-muted-foreground" />;
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full flex items-center gap-3 px-2.5 py-6 hover:bg-accent rounded-sm transition-all focus-visible:ring-0 group/settings",
                            isCollapsed ? "justify-center" : "justify-start px-4"
                        )}
                        aria-label="账号与设置"
                    >
                        <div className="relative shrink-0">
                            <Settings className="w-5 h-5 text-muted-foreground group-hover/settings:text-primary transition-colors" />
                            {/* 状态小圆点提示 */}
                            {(user || isGuest) && (
                                <span className={cn(
                                    "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-background",
                                    user ? "bg-primary" : "bg-amber-500"
                                )} />
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="text-sm font-medium">设置中心</span>
                                <span className="text-[10px] text-muted-foreground truncate w-full flex items-center gap-1">
                                    {user ? (user.email || '管理员') : (isGuest ? '访客 (已解锁)' : '未登录/匿名')}
                                </span>
                            </div>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-64 rounded-sm border-border/40 backdrop-blur-md bg-popover/90 p-1 shadow-2xl">
                    <DropdownMenuLabel className="font-normal px-3 py-3">
                        <div className="flex flex-col space-y-2">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-sans opacity-60">Identity / 身份</p>
                            <div className="flex items-center gap-2.5">
                                <div className={cn(
                                    "p-2 rounded-sm",
                                    user ? "bg-primary/10" : (isGuest ? "bg-amber-100/50 dark:bg-amber-900/20" : "bg-muted")
                                )}>
                                    {renderIdentity()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-semibold truncate leading-none">
                                        {user ? "正式管理员" : (isGuest ? "授权访客" : "匿名身份")}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                                        {user ? user.email : (isGuest ? "持有有效访问口令" : "当前仅可查看公开内容")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="opacity-50" />

                    {/* 视觉与偏好 */}
                    <div className="px-1 py-1">
                        <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-sans">Settings / 偏好</p>
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
                        <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-sans">Tools / 工具</p>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    className="rounded-sm disabled:opacity-40"
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={!user}
                                    title={!user ? "仅管理员可导出数据" : undefined}
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
                                <DropdownMenuItem className="rounded-sm" onClick={() => setIsUnlockOpen(true)}>
                                    <Lock className="mr-2 h-4 w-4 text-amber-500" />
                                    <span>{isGuest ? '重新输入口令' : '输入访问口令'}</span>
                                </DropdownMenuItem>
                                {isGuest && (
                                    <DropdownMenuItem className="rounded-sm text-muted-foreground" onClick={handleClearGuest}>
                                        <Unlock className="mr-2 h-4 w-4" />
                                        <span>清除口令并锁定</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="rounded-sm" onClick={() => {
                                    setViewMode('CARD_VIEW');
                                }}>
                                    <LogIn className="mr-2 h-4 w-4 text-primary" />
                                    <span>管理员登录</span>
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
                                <span>登出管理系统</span>
                            </DropdownMenuItem>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* 口令解锁弹窗 */}
            <UnlockDialog
                isOpen={isUnlockOpen}
                onClose={() => setIsUnlockOpen(false)}
                hint="输入全站通行口令以获取浏览权限"
            />
        </>
    );
}
