'use client';

import { useState } from 'react';
import { login, signInWithOAuth } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result.success) {
            router.push('/');
            router.refresh();
        } else {
            setError(result.error || '登录失败');
        }
        setLoading(false);
    };

    const handleOAuthLogin = async (provider: 'github' | 'google') => {
        setOauthLoading(provider);
        setError(null);
        const result = await signInWithOAuth(provider);
        if (!result.success) {
            setError(result.error || `${provider} 登录失败`);
            setOauthLoading(null);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">JustMemo</h1>
                    <p className="text-sm text-muted-foreground mt-2">管理控制台登录</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-6">
                    {/* 第三方登录 */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleOAuthLogin('github')}
                            disabled={!!oauthLoading}
                            className="w-full"
                        >
                            {oauthLoading === 'github' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Github className="w-4 h-4 mr-2" />
                            )}
                            GitHub
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleOAuthLogin('google')}
                            disabled={!!oauthLoading}
                            className="w-full"
                        >
                            {oauthLoading === 'google' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="mr-2 font-bold text-lg leading-none">G</span>
                            )}
                            Google
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">或者使用邮箱</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
                                邮箱
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="admin@example.com"
                                    className="pl-10 h-11"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
                                    密码
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    忘记密码？
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="pl-10 h-11"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading || !!oauthLoading}
                            className="w-full h-11"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    登录中...
                                </>
                            ) : (
                                '管理员登录'
                            )}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    系统管理员：XiaoX · JustMemo v0.1.0
                </p>
            </div>
        </div>
    );
}
