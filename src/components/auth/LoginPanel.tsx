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
import { useLoginMode } from '@/context/LoginModeContext';
// import './themes.css'; // Assuming themes.css is global or handled via import in layout

export function LoginPanel() {
    const { viewMode, setViewMode } = useLoginMode();
    const router = useRouter();

    // Login form states
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

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
                router.refresh();
                // If we are already on home, refresh to update auth state
                window.location.reload();
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

    const loginPanelVariants: Variants = {
        home: {
            x: '-10%',
            opacity: 0,
            transition: { duration: 0.6, ease: 'easeIn' },
            zIndex: -1
        },
        card: {
            x: '-10%',
            opacity: 0,
            transition: { duration: 0.6, ease: 'easeIn' },
            zIndex: -1
        },
        split: {
            x: '0%', // Occupy left half
            opacity: 1,
            zIndex: 20,
            transition: {
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        home: { y: 20, opacity: 0 },
        card: { y: 20, opacity: 0 },
        split: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
        }
    };

    // Mapping viewMode to variant keys
    const getVariant = () => {
        if (viewMode === 'HOME_FOCUS') return 'home';
        if (viewMode === 'CARD_VIEW') return 'card';
        return 'split';
    };

    return (
        <motion.div
            variants={loginPanelVariants}
            initial="home"
            animate={getVariant()}
            className="fixed left-0 top-0 w-[50%] h-full flex items-center justify-center p-12 overflow-hidden pointer-events-none"
        >
            <div className="w-full max-w-[400px] space-y-16 pointer-events-auto">
                {/* Hero / Brand */}
                <motion.div variants={itemVariants} className="space-y-4 text-left">
                    <h1 className="text-7xl font-bold tracking-tighter text-primary font-editorial italic underline underline-offset-[12px] decoration-1 decoration-primary/20">JustMemo</h1>
                    <p className="text-[10px] text-muted-foreground font-sans tracking-[0.5em] uppercase opacity-40 ml-1">The Writer&apos;s Study · Vol 2.0</p>
                </motion.div>

                {/* Login Form Container */}
                <div className="space-y-12">
                    {/* Social Login */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
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
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full bg-black/5" />
                        </div>
                        <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.3em]">
                            <span className="px-6 text-muted-foreground/30 font-sans bg-[#fdfcf9]">Or Legacy Identity</span>
                        </div>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-10">

                        <motion.div variants={itemVariants} className="space-y-4">
                            <label
                                htmlFor="email"
                                // style={{ fontFamily: 'var(--login-label-font)' }}
                                className="block text-[11px] font-bold text-foreground/30 ml-1 tracking-[0.2em] uppercase font-sans"
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
                                        // boxShadow: 'var(--login-input-border)',
                                        boxShadow: '0 1px 0 0 rgba(0,0,0,0.1)'
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
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-4">
                            <div className="flex items-center justify-between ml-1">
                                <label
                                    htmlFor="password"
                                    // style={{ fontFamily: 'var(--login-label-font)' }}
                                    className="block text-[11px] font-bold text-foreground/30 tracking-[0.2em] uppercase font-sans"
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
                                        // boxShadow: 'var(--login-input-border)',
                                        boxShadow: '0 1px 0 0 rgba(0,0,0,0.1)'
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
                        </motion.div>

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

                        <motion.div variants={itemVariants}>
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
                        </motion.div>
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
    );
}
