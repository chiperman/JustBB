'use client';

import { useState, useEffect } from 'react';
import { login, signInWithOAuth } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Github, Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { MainLayoutClient } from "@/components/layout/MainLayoutClient";
import { getMemos } from "@/actions/fetchMemos";
import { Memo } from "@/types/memo";
import { TimelineProvider } from "@/context/TimelineContext";
import { Suspense } from 'react';
import './themes.css';

export default function LoginPage() {
    const [viewMode, setViewMode] = useState<'HOME_FOCUS' | 'CARD_VIEW' | 'SPLIT_VIEW'>('HOME_FOCUS');
    const [memos, setMemos] = useState<Memo[]>([]);

    // Login form states
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const loadMemos = async () => {
            try {
                const data = await getMemos({ limit: 10 });
                setMemos(data || []);
            } catch (err) {
                console.error("Failed to load memos:", err);
            }
        };
        loadMemos();

        // Auto-trigger entrance animation (Step 1: Shrink to Card)
        // 增加延迟至 1200ms，确保用户能先看到完整的“主页”状态，形成视觉对比
        const timer = setTimeout(() => {
            setViewMode('CARD_VIEW');
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await login(formData);

        if (result.success) {
            // Success transition
            setViewMode('HOME_FOCUS');
            setTimeout(() => {
                router.push('/');
                router.refresh();
            }, 800);
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

    // Orchestration Variants
    // Orchestration Variants
    const homeTransitionVariants: Variants = {
        home: {
            scale: 1,
            x: '0%',
            opacity: 1,
            filter: 'blur(0px)',
            borderRadius: '0px',
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        card: {
            scale: 0.9,
            x: '0%', // Keep centered for Step 1
            opacity: 1,
            filter: 'blur(0px)',
            borderRadius: '24px', // Physical card look
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        },
        split: {
            scale: 0.9,
            x: '50%', // Occupy right half
            opacity: 1,
            filter: 'blur(2px)',
            borderRadius: '24px',
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    const loginPanelVariants: Variants = {
        home: {
            x: '-100%',
            opacity: 0,
            transition: { duration: 0.6, ease: 'easeIn' }
        },
        card: {
            x: '-100%', // Keep hidden for Step 1
            opacity: 0,
            transition: { duration: 0.6, ease: 'easeIn' }
        },
        split: {
            x: '0%', // Occupy left half
            opacity: 1,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <TimelineProvider>
            <div className="fixed inset-0 overflow-hidden bg-[#fdfcf9] paper-texture">
                {/* Background Decorative Text */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
                    <motion.span
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 0.05, x: 0 }}
                        className="absolute top-[10%] left-[5%] text-[15vw] font-editorial italic"
                    >
                        Draft
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 0.03, x: 0 }}
                        className="absolute bottom-[15%] right-[10%] text-[12vw] font-editorial"
                    >
                        Archive
                    </motion.span>
                </div>

                {/* Split View Container */}
                <div
                    className="relative w-full h-full z-10"
                >
                    {/* Home Panel (Main Content) */}
                    <motion.div
                        variants={homeTransitionVariants}
                        initial="home"
                        animate={viewMode === 'HOME_FOCUS' ? 'home' : (viewMode === 'CARD_VIEW' ? 'card' : 'split')}
                        className="absolute inset-0 z-10 origin-center overflow-hidden bg-white"
                        style={{ borderRadius: viewMode === 'HOME_FOCUS' ? 0 : 24 }}
                    >
                        <div className="w-full h-full pointer-events-auto shadow-2xl overflow-hidden border border-black/5" style={{ borderRadius: 'inherit' }}>
                            {/* Actual Home Page Content */}
                            <div className={viewMode === 'SPLIT_VIEW' ? "pointer-events-none select-none grayscale-[0.2] h-full" : "h-full"}>
                                <Suspense fallback={<div className="w-full h-full bg-background animate-pulse" />}>
                                    <MainLayoutClient
                                        memos={memos}
                                        searchParams={{}}
                                    />
                                </Suspense>
                            </div>

                            {/* Overlay Trigger in Home Focus */}
                            <AnimatePresence>
                                {viewMode === 'HOME_FOCUS' && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="absolute top-10 left-10 z-50"
                                    >
                                        <Button
                                            variant="default"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewMode('SPLIT_VIEW');
                                            }}
                                            className="h-12 px-8 bg-primary hover:bg-black text-white rounded-none font-bold tracking-[0.2em] uppercase transition-all shadow-xl"
                                        >
                                            <LogIn className="w-4 h-4 mr-3" />
                                            Authenticate
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Login Panel (Auth Form) */}
                    <motion.div
                        variants={loginPanelVariants}
                        initial="home"
                        animate={viewMode === 'HOME_FOCUS' ? 'home' : 'split'}
                        className="absolute left-0 w-[50%] h-full z-20 flex items-center justify-center p-12 overflow-hidden pointer-events-none"
                    >
                        <div className="w-full max-w-[400px] space-y-16 pointer-events-auto">
                            {/* Hero / Brand */}
                            <div className="space-y-4 text-left">
                                <h1 className="text-7xl font-bold tracking-tighter text-primary font-editorial italic underline underline-offset-[12px] decoration-1 decoration-primary/20">JustMemo</h1>
                                <p className="text-[10px] text-muted-foreground font-sans tracking-[0.5em] uppercase opacity-40 ml-1">The Writer&apos;s Study · Vol 2.0</p>
                            </div>

                            {/* Login Form Container */}
                            <div className="space-y-12">
                                {/* Social Login */}
                                <div className="grid grid-cols-2 gap-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleOAuthLogin('github')}
                                        disabled={!!oauthLoading}
                                        className="w-full h-14 group cursor-pointer transition-all duration-500 border-black/10 hover:bg-black/5 rounded-none border-0 border-b bg-transparent"
                                    >
                                        {oauthLoading === 'github' ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        ) : (
                                            <Github className="w-5 h-5 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                        <span className="font-sans font-bold tracking-widest text-[11px] uppercase">GitHub</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleOAuthLogin('google')}
                                        disabled={!!oauthLoading}
                                        className="w-full h-14 group cursor-pointer transition-all duration-500 border-black/10 hover:bg-black/5 rounded-none border-0 border-b bg-transparent"
                                    >
                                        {oauthLoading === 'google' ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        ) : (
                                            <span className="mr-3 font-bold text-lg leading-none text-muted-foreground group-hover:text-primary transition-colors">G</span>
                                        )}
                                        <span className="font-sans font-bold tracking-widest text-[11px] uppercase">Google</span>
                                    </Button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="w-full bg-black/5" />
                                    </div>
                                    <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.3em]">
                                        <span className="px-6 text-muted-foreground/30 font-sans bg-[#fdfcf9]">Or Legacy Identity</span>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="space-y-4">
                                        <label
                                            htmlFor="email"
                                            style={{ fontFamily: 'var(--login-label-font)' }}
                                            className="block text-[11px] font-bold text-foreground/30 ml-1 tracking-[0.2em] uppercase"
                                        >
                                            Account Identity
                                        </label>
                                        <div className="relative group">
                                            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/20 group-focus-within:text-primary transition-colors duration-500 z-10" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="writer@example.com"
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'var(--login-input-border)',
                                                }}
                                                className="h-12 border-0 focus-visible:ring-0 transition-all duration-500 font-sans pl-8 rounded-none bg-transparent"
                                            />
                                            <motion.div
                                                className="absolute bottom-0 left-0 h-[1px] bg-primary"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '100%' }}
                                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <label
                                                htmlFor="password"
                                                style={{ fontFamily: 'var(--login-label-font)' }}
                                                className="block text-[11px] font-bold text-foreground/30 tracking-[0.2em] uppercase"
                                            >
                                                Secret Code
                                            </label>
                                            <Link
                                                href="/forgot-password"
                                                className="text-[10px] font-bold text-muted-foreground/30 hover:text-primary transition-colors font-sans uppercase tracking-widest"
                                            >
                                                Recovery
                                            </Link>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/20 group-focus-within:text-primary transition-colors duration-500 z-10" />
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                placeholder="••••••••"
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    boxShadow: 'var(--login-input-border)',
                                                }}
                                                className="h-12 border-0 focus-visible:ring-0 transition-all duration-500 font-sans pl-8 pr-12 rounded-none bg-transparent"
                                            />
                                            <motion.div
                                                className="absolute bottom-0 left-0 h-[1px] bg-primary"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: '100%' }}
                                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/20 hover:text-primary transition-colors duration-500 focus:outline-none cursor-pointer"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            role="alert"
                                            className="text-[11px] p-4 rounded-none font-sans flex items-center gap-4 bg-destructive/[0.03] border-l-2 border-destructive text-destructive/80"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                            {error}
                                        </motion.div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading || !!oauthLoading}
                                        className="w-full h-16 bg-primary hover:bg-black text-white rounded-none font-bold tracking-[0.3em] uppercase transition-all duration-700 shadow-2xl shadow-primary/20 group"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-3 opacity-50" />
                                        ) : (
                                            <span className="flex items-center">
                                                Enter the Study
                                                <motion.span
                                                    initial={{ x: 0 }}
                                                    whileHover={{ x: 5 }}
                                                    className="ml-3"
                                                >
                                                    →
                                                </motion.span>
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </div>

                        {/* Return Focus Hint */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: viewMode === 'SPLIT_VIEW' ? 1 : 0 }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer group z-50 p-2"
                            onClick={() => setViewMode('HOME_FOCUS')}
                        >
                            <div className="w-0.5 h-24 bg-primary/20 group-hover:bg-primary transition-all duration-500" />
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </TimelineProvider>
    );
}
