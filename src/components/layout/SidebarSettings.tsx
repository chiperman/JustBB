'use client';

import * as React from 'react';
import { Settings, User, Sun, Moon, Monitor, Type, LogOut, LogIn, ChevronRight, Download, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { logout, getCurrentUser } from '@/actions/auth';
import { cn } from '@/lib/utils';
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
    const [loading, setLoading] = React.useState(true);
    const [loggingOut, setLoggingOut] = React.useState(false);
    const [isSans, setIsSans] = React.useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    React.useEffect(() => {
        getCurrentUser().then((u) => {
            setUser(u);
            setLoading(false);
        });

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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full flex items-center gap-3 px-2.5 py-6 hover:bg-accent rounded-sm transition-all focus-visible:ring-0",
                        isCollapsed ? "justify-center" : "justify-start"
                    )}
                >
                    <Settings className="w-5 h-5 text-muted-foreground shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium">设置</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56 rounded-sm">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">系统设置</p>
                        {user && (
                            <p className="text-sm font-medium leading-none truncate py-1">
                                {user.email || '管理员'}
                            </p>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* 主题选择 */}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="rounded-sm">
                        <Sun className="mr-2 h-4 w-4" />
                        <span>主题外观</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="rounded-sm ml-1">
                        <DropdownMenuItem className="rounded-sm" onClick={() => setTheme('light')}>
                            <Sun className="mr-2 h-4 w-4" />
                            <span>浅色</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-sm" onClick={() => setTheme('dark')}>
                            <Moon className="mr-2 h-4 w-4" />
                            <span>深色</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-sm" onClick={() => setTheme('system')}>
                            <Monitor className="mr-2 h-4 w-4" />
                            <span>系统默认</span>
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* 字体切换 */}
                <DropdownMenuItem className="rounded-sm" onClick={toggleFont}>
                    <Type className="mr-2 h-4 w-4" />
                    <span>字体模式: {isSans ? '无衬线' : '衬线'}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* 数据导出 */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="rounded-sm" onSelect={(e) => e.preventDefault()}>
                            <Download className="mr-2 h-4 w-4" />
                            <span>导出数据 (MD)</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-sm">
                        <AlertDialogHeader>
                            <AlertDialogTitle>确认导出数据？</AlertDialogTitle>
                            <AlertDialogDescription>
                                系统将处理所有记录并生成一个 Markdown 格式的备份文件供你下载。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-sm">取消</AlertDialogCancel>
                            <AlertDialogAction className="rounded-sm" onClick={handleExport}>
                                确认导出
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <DropdownMenuSeparator />

                {/* 登录/登出 */}
                {loading ? (
                    <DropdownMenuItem disabled className="rounded-sm">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>加载中...</span>
                    </DropdownMenuItem>
                ) : user ? (
                    <DropdownMenuItem
                        className="rounded-sm text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        {loggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                        <span>退出登录</span>
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem className="rounded-sm" onClick={() => router.push('/admin/login')}>
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>管理员登录</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
