'use client';

import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';
import { logout } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UnauthorizedPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/admin/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full space-y-8 text-center bg-card border border-border rounded-3xl p-10 shadow-xl">
                <div className="flex justify-center">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <ShieldAlert className="w-12 h-12 text-destructive" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight">无权访问</h1>
                    <p className="text-muted-foreground leading-relaxed">
                        抱歉，您的账号目前不具备管理员权限。JustMemo 是一套私有记录系统，仅限指定管理员登录。
                    </p>
                </div>

                <div className="pt-6 flex flex-col gap-3">
                    <Button asChild variant="outline" className="rounded-xl h-12">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            返回首页
                        </Link>
                    </Button>
                    <Button onClick={handleLogout} className="rounded-xl h-12 bg-primary hover:bg-primary/90">
                        <LogOut className="mr-2 h-4 w-4" />
                        切换账号登录
                    </Button>
                </div>

                <div className="pt-8 border-t border-border/50">
                    <p className="text-xs text-muted-foreground/60">
                        如果您认为这是一个错误，请联系系统管理员。
                    </p>
                </div>
            </div>
        </div>
    );
}
