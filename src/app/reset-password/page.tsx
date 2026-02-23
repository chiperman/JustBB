'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HugeiconsIcon } from '@hugeicons/react';
import { CircleLock01Icon as Lock, ShieldCheck, Loading01Icon as Loader2, CheckmarkCircle01Icon as CheckCircle2 } from '@hugeicons/core-free-icons';
import { updatePassword } from '@/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "校验失败",
                description: "两次输入的密码不一致。",
            });
            return;
        }

        if (password.length < 8) {
            toast({
                variant: "destructive",
                title: "密码太弱",
                description: "新密码至少需要 8 个字符。",
            });
            return;
        }

        setIsLoading(true);

        const result = await updatePassword(password);

        if (result.success) {
            setIsSuccess(true);
            toast({
                title: "密码重置成功",
                description: "您的密码已更新，即将前往首页。",
            });
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 2000);
        } else {
            toast({
                variant: "destructive",
                title: "重置失败",
                description: result.error || "链接可能已过期，请重新申请。",
            });
        }
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="max-w-md w-full space-y-8 text-center bg-card border border-border rounded-3xl p-10 shadow-xl">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <HugeiconsIcon icon={CheckCircle2} size={48} className="text-primary" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight">重置成功</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            您的新密码已生效。系统正在为您准备环境，请稍候...
                        </p>
                    </div>
                    <div className="pt-4">
                        <HugeiconsIcon icon={Loader2} size={32} className="animate-spin text-primary mx-auto" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full space-y-8 bg-card border border-border rounded-3xl p-10 shadow-xl">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <HugeiconsIcon icon={ShieldCheck} size={32} className="text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">设置新密码</h1>
                    <p className="text-muted-foreground">
                        请确保新密码足够强大且便于记忆。
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="password">新密码</Label>
                        <div className="relative">
                            <HugeiconsIcon icon={Lock} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="请输入新密码"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 h-12 rounded-xl border-border/50 focus:ring-primary/20"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">确认新密码</Label>
                        <div className="relative">
                            <HugeiconsIcon icon={Lock} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="请再次输入新密码"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 h-12 rounded-xl border-border/50 focus:ring-primary/20"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 mt-4 transition-all active:scale-[0.98]" disabled={isLoading}>
                        {isLoading ? <HugeiconsIcon icon={Loader2} size={20} className="animate-spin" /> : '更新密码并登录'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
