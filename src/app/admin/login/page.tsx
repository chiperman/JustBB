'use client';

import { useState } from 'react';
import { login } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-primary">JustMemo</h1>
                    <p className="text-sm text-muted-foreground mt-2">管理员登录</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
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
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-2">
                            密码
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                登录中...
                            </>
                        ) : (
                            '登录'
                        )}
                    </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    仅限管理员访问 · JustMemo
                </p>
            </div>
        </div>
    );
}
