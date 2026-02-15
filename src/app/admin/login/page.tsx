'use client';

import { useState } from 'react';
import { login, signInWithOAuth } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Github, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
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

    // Staging: Orchestrates the entrance of all elements
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.12, // Slower, more "Contemplative" flow
                delayChildren: 0.3 // Let the empty room breathe for a moment
            }
        }
    };

    // Inner Staging: For nested elements like lists, immediate flow
    const innerContainerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05, // Fast ripple
                delayChildren: 0 // No delay, start immediately when parent appears
            }
        }
    };

    // Physics: Spring animation for natural weight and settle
    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0, filter: 'blur(4px)' },
        visible: {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            transition: {
                type: 'spring' as const,
                bounce: 0,
                duration: 0.8,
                stiffness: 100, // Reduced stiffness = Heavier/Calmer feel
                damping: 20
            }
        }
    };

    // Card specific entrance - slight scale for "unfolding" feel
    const cardVariants: Variants = {
        hidden: { scale: 0.96, opacity: 0, y: 10 },
        visible: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 220, // Smoother unfolding
                damping: 25
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]">
            {/* Background Atmosphere - Breathing Spotlights */}
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none"
            />

            <motion.div
                className="w-full max-w-[400px] relative z-10 opacity-0" // FOUC Fix: opacity-0 ensures invisibility before hydration
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Hero / Brand */}
                <motion.div variants={itemVariants} className="text-center mb-10 space-y-3">
                    <h1 className="text-5xl font-serif font-bold tracking-tight text-primary drop-shadow-sm">JustMemo</h1>
                    <p className="text-base text-muted-foreground font-sans tracking-[0.2em] uppercase text-xs opacity-80">The Writer's Study</p>
                </motion.div>

                {/* Main Card */}
                <motion.div
                    variants={cardVariants}
                    className="bg-card/80 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/5 space-y-8"
                >
                    {/* Social Login */}
                    <motion.div variants={innerContainerVariants} className="grid grid-cols-2 gap-4">
                        <motion.div variants={itemVariants}>
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin('github')}
                                disabled={!!oauthLoading}
                                asChild
                                className="w-full h-12 rounded-xl border-border/60 hover:border-primary/50 hover:bg-primary/5 group cursor-pointer"
                            >
                                <motion.button>
                                    {oauthLoading === 'github' ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    ) : (
                                        <Github className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                                    )}
                                    <span className="font-sans">GitHub</span>
                                </motion.button>
                            </Button>
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin('google')}
                                disabled={!!oauthLoading}
                                asChild
                                className="w-full h-12 rounded-xl border-border/60 hover:border-primary/50 hover:bg-primary/5 group cursor-pointer"
                            >
                                <motion.button>
                                    {oauthLoading === 'google' ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    ) : (
                                        <span className="mr-2 font-bold text-lg leading-none text-muted-foreground group-hover:text-primary transition-colors">G</span>
                                    )}
                                    <span className="font-sans">Google</span>
                                </motion.button>
                            </Button>
                        </motion.div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full bg-border/60" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-4 text-muted-foreground font-sans tracking-widest opacity-60">Or continue with</span>
                        </div>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label htmlFor="email" className="block text-xs font-medium text-foreground/60 font-sans ml-1 tracking-wider uppercase">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300 z-10" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="writer@example.com"
                                    className="pl-12 h-12 rounded-xl bg-background/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 focus-visible:bg-background transition-all duration-300 font-sans"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label htmlFor="password" className="block text-xs font-medium text-foreground/60 font-sans tracking-wider uppercase">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors font-sans underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-primary"
                                >
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300 z-10" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="••••••••"
                                    className="pl-12 pr-12 h-12 rounded-xl bg-background/50 border-border/60 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 focus-visible:bg-background transition-all duration-300 font-sans"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors duration-300 focus:outline-none cursor-pointer"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </motion.div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                role="alert"
                                aria-live="polite"
                                className="text-sm text-error bg-error/5 border border-error/20 p-4 rounded-xl font-sans flex items-center gap-2 backdrop-blur-sm"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-error shrink-0 animate-pulse" />
                                {error}
                            </motion.div>
                        )}

                        <motion.div variants={itemVariants}>
                            <Button
                                type="submit"
                                disabled={loading || !!oauthLoading}
                                asChild
                                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 cursor-pointer font-sans font-medium text-base tracking-wide"
                            >
                                <motion.button>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Accessing...
                                        </>
                                    ) : (
                                        'Enter Studio'
                                    )}
                                </motion.button>
                            </Button>
                        </motion.div>
                    </form>
                </motion.div>

                <motion.p
                    variants={itemVariants}
                    className="text-center text-[10px] text-muted-foreground/40 mt-12 font-sans tracking-widest uppercase"
                >
                    JustMemo · Crafted with Soul
                </motion.p>
            </motion.div>
        </div>
    );
}
