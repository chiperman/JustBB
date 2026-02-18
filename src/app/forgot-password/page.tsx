'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { sendPasswordResetEmail } from '@/actions/auth';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await sendPasswordResetEmail(email);

        if (result.success) {
            setIsSent(true);
            toast({
                title: "邮件已发送",
                description: "请检查您的收件箱以获取重置链接。",
            });
        } else {
            toast({
                variant: "destructive",
                title: "发送失败",
                description: result.error || "请稍后重试。",
            });
        }
        setIsLoading(false);
    };

    if (isSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="max-w-md w-full space-y-8 text-center bg-card border border-border rounded-3xl p-10 shadow-xl">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <CheckCircle2 className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold tracking-tight">请检查邮箱</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            密码重置链接已发送至 <strong>{email}</strong>。<br />
                            请点击邮件中的链接以设置新密码。
                        </p>
                    </div>
                    <div className="pt-6">
                        <Button asChild variant="outline" className="w-full rounded-xl h-12">
                            <Link href="/">返回首页</Link>
                        </Button>
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
                        <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">找回密码</h1>
                    <p className="text-muted-foreground">
                        输入您的注册邮箱，我们将为您发送重置链接。
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium ml-1">邮箱地址</Label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-12 rounded-xl border-border/50 focus:ring-primary/20"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : '发送重置链接'}
                    </Button>
                </form>

                <div className="pt-6 text-center">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        返回登录
                    </Link>
                </div>

                <div className="pt-8 border-t border-border/50 text-center">
                    <p className="text-xs text-muted-foreground/60 leading-relaxed italic">
                        提示：如果您使用社交账号（GitHub/Google）登录，<br />
                        请直接返回登录页点击社交登录按钮。
                    </p>
                </div>
            </div>
        </div>
    );
}
