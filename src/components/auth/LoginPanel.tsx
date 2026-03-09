'use client';

import React, { useState, useEffect } from 'react';
import { login, signup, signInWithOAuth, verifyOtp, checkUserExists } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    CircleLock01Icon as Lock,
    Mail01Icon as Mail,
    Loading01Icon as Loader2,
    GithubIcon as Github,
    ViewIcon as Eye,
    ViewOffIcon as EyeOff,
    ArrowRight01Icon as ArrowRight,
    PencilEdit01Icon as Edit2,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useLayout } from '@/context/LayoutContext';
import { OtpInput } from './OtpInput';
import { PasswordStrength } from './PasswordStrength';

export function LoginPanel() {
    const { viewMode, setViewMode } = useLayout();
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);

    // Common states
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Unified Auth Flow States
    const [step, setStep] = useState<'EMAIL' | 'AUTH'>('EMAIL');
    const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(true);

    // Register specific states
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);

    // Timer effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Reset form when returning to HOME_FOCUS
    useEffect(() => {
        if (viewMode === 'HOME_FOCUS') {
            setStep('EMAIL');
            setAuthMode('LOGIN');
            setEmail('');
            setPassword('');
            setOtpSent(false);
            setCountdown(0);
            setError(null);
            setShowPassword(false);
            setIsEmailValid(true);
            setOtp(['', '', '', '', '', '', '', '']);
        }
    }, [viewMode]);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('请输入电子邮箱');
            return;
        }

        if (!validateEmail(email)) {
            setError('请输入有效的电子邮箱格式');
            setIsEmailValid(false);
            return;
        }
        setIsEmailValid(true);
        setLoading(true);
        setError(null);

        try {
            const res = await checkUserExists(email);
            if (!res.success) {
                setError(res.error || '检查用户状态失败');
                setLoading(false);
                return;
            }

            setAuthMode(res.data?.exists ? 'LOGIN' : 'REGISTER');
            setStep('AUTH');
        } catch {
            setError('检查用户状态失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleSendCode = async (formData: FormData) => {
        setLoading(true);
        setError(null);
        const password = formData.get('password') as string;

        // Ensure email is present in formData
        formData.set('email', email);

        // Basic password validation
        if (!password || password.length < 8) {
            setError('密码至少需要8位字符');
            setLoading(false);
            return;
        }

        const res = await signup(formData); // This sends the email
        if (res.success) {
            setOtpSent(true);
            setCountdown(60);
        } else {
            setError(res.error || '发送验证码失败');
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // If in step 1, handle email check
        if (step === 'EMAIL') {
            await handleEmailSubmit(e);
            return;
        }

        // In Step 2
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        // Ensure email is in formData since input might be disabled but value is state
        formData.set('email', email);

        if (authMode === 'REGISTER') {
            const otpValue = otp.join('');
            formData.set('otp', otpValue);

            if (!otpSent) {
                if (!otpValue) {
                    await handleSendCode(formData);
                    return;
                }
            }

            // Verify OTP
            if (!otpValue || otpValue.length !== 8) {
                setError('请输入8位验证码');
                setLoading(false);
                return;
            }

            const result = await verifyOtp(email, otpValue);
            if (result.success) {
                setViewMode('CARD_VIEW');
                setTimeout(() => window.location.reload(), 500);
            } else {
                setError(result.error || '验证失败');
            }

        } else {
            // Login Mode
            const result = await login(formData);
            if (result.success) {
                setViewMode('CARD_VIEW');
                setTimeout(() => {
                    router.refresh();
                    window.location.reload();
                }, 500);
            } else {
                setError(result.error || '登录失败');
            }
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
            x: '-100%',
            scale: 0.9,
            opacity: 0,
            borderRadius: '24px',
            transition: { type: 'spring', stiffness: 260, damping: 26, mass: 1 },
            zIndex: -1
        },
        card: {
            x: '-100%',
            scale: 0.9,
            opacity: 0,
            borderRadius: '24px',
            transition: { type: 'spring', stiffness: 260, damping: 26, mass: 1 },
            zIndex: -1
        },
        split: {
            x: '0%',
            scale: 0.9,
            opacity: 1,
            zIndex: 20,
            borderRadius: '24px',
            backgroundColor: 'var(--background)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 24,
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const handlePasteOtp = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const digits = text.replace(/[^0-9]/g, '').slice(0, 8).split('');
            if (digits.length > 0) {
                const newOtp = [...otp];
                digits.forEach((digit, i) => {
                    if (i < 8) newOtp[i] = digit;
                });
                setOtp(newOtp);
            }
        } catch (error) {
            console.error('Failed to read clipboard:', error);
        }
    };

    const itemVariants: Variants = {
        home: { y: 20, opacity: 0 },
        card: { y: 20, opacity: 0 },
        split: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        }
    };

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
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] contrast-125 brightness-100 z-0">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>
            <div className="w-full max-w-[400px] space-y-16 pointer-events-auto">
                <motion.div variants={itemVariants} className="space-y-4 text-left">
                    <h1 className="text-7xl font-bold tracking-tighter text-primary font-editorial italic underline underline-offset-[12px] decoration-1 decoration-primary/20">JustMemo</h1>
                    <p className="text-[10px] text-muted-foreground tracking-[0.5em] uppercase opacity-40 ml-1">极简笔记与创作空间</p>
                </motion.div>

                <div className="space-y-12">
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
                        <motion.div whileTap={{ scale: 0.96 }}>
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin('github')}
                                disabled={!!oauthLoading}
                                className="w-full h-14 group cursor-pointer transition-all duration-300 border-foreground/10 hover:bg-foreground/[0.03] rounded-none border-0 border-b bg-transparent"
                            >
                                {oauthLoading === 'github' ? (
                                    <HugeiconsIcon icon={Loader2} size={20} className="animate-spin text-primary" />
                                ) : (
                                    <HugeiconsIcon icon={Github} size={20} className="mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                                <span className="font-bold tracking-widest text-[11px] uppercase">GitHub</span>
                            </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }}>
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin('google')}
                                disabled={!!oauthLoading}
                                className="w-full h-14 group cursor-pointer transition-all duration-300 border-foreground/10 hover:bg-foreground/[0.03] rounded-none border-0 border-b bg-transparent"
                            >
                                {oauthLoading === 'google' ? (
                                    <HugeiconsIcon icon={Loader2} size={20} className="animate-spin text-primary" />
                                ) : (
                                    <span className="mr-3 font-bold text-lg leading-none text-muted-foreground group-hover:text-primary transition-colors">G</span>
                                )}
                                <span className="font-bold tracking-widest text-[11px] uppercase">Google</span>
                            </Button>
                        </motion.div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full bg-black/5" />
                        </div>
                        <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.3em]">
                            <span className="px-6 text-muted-foreground/30 bg-[#fdfcf9]">其他登录方式</span>
                        </div>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <motion.div variants={itemVariants} className="space-y-4">
                            <label htmlFor="email" className="block text-[12px] font-medium text-foreground/40 ml-1 italic">电子邮箱</label>
                            <div className="relative group">
                                <HugeiconsIcon icon={Mail} size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/10 group-focus-within:text-primary transition-colors duration-500 z-10" />
                                <Input
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (e.target.value && !isEmailValid) setIsEmailValid(true);
                                    }}
                                    placeholder="writer@example.com"
                                    readOnly={step === 'AUTH'}
                                    autoFocus
                                    className={`h-12 border-0 focus-visible:ring-0 transition-all duration-500 pl-8 rounded-none bg-transparent shadow-[0_1px_0_0_rgba(0,0,0,0.05)] focus:shadow-[0_2px_0_0_rgba(var(--primary-rgb),0.3)] ${step === 'AUTH' ? 'text-foreground/50 cursor-not-allowed opacity-60' : ''} ${!isEmailValid ? 'text-destructive focus:shadow-[0_2px_0_0_rgba(var(--destructive-rgb),0.5)]' : ''}`}
                                />
                                {step === 'AUTH' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('EMAIL');
                                            setError(null);
                                            setOtpSent(false);
                                            setCountdown(0);
                                        }}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground/30 hover:text-primary transition-colors z-20"
                                    >
                                        <HugeiconsIcon icon={Edit2} size={12} />
                                    </button>
                                )}
                                <motion.div className="absolute bottom-0 left-0 h-[1px] bg-primary" initial={{ width: 0 }} whileInView={{ width: '100%' }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
                            </div>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {step === 'AUTH' && (
                                <motion.div key="auth-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <label htmlFor="password" className="block text-[12px] font-medium text-foreground/40 italic">{authMode === 'REGISTER' ? '设置密码' : '登录密码'}</label>
                                            {authMode === 'LOGIN' && (
                                                <Link href="/forgot-password" className="text-[10px] font-bold text-muted-foreground/20 hover:text-primary transition-colors uppercase tracking-widest border-b border-muted-foreground/10 pb-0.5">
                                                    忘记密码？
                                                </Link>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <HugeiconsIcon icon={Lock} size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/10 group-focus-within:text-primary transition-colors duration-500 z-10" />
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={authMode === 'REGISTER' ? "至少8位，包含大小写、数字及符号" : "请输入密码"}
                                                className="h-12 border-0 focus-visible:ring-0 transition-all duration-500 pl-8 pr-12 rounded-none bg-transparent placeholder:text-foreground/20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] focus:shadow-[0_2px_0_0_rgba(var(--primary-rgb),0.3)]"
                                            />
                                            <motion.div className="absolute bottom-0 left-0 h-[1px] bg-primary" initial={{ width: 0 }} whileInView={{ width: '100%' }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/20 hover:text-primary transition-colors duration-500 focus:outline-none cursor-pointer"
                                            >
                                                {showPassword ? <HugeiconsIcon icon={EyeOff} size={16} /> : <HugeiconsIcon icon={Eye} size={16} />}
                                            </button>
                                        </div>
                                        {authMode === 'REGISTER' && <PasswordStrength password={password} />}
                                    </div>

                                    {authMode === 'REGISTER' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between ml-1">
                                                <label htmlFor="otp-0" className="block text-[12px] font-medium text-foreground/40 italic">验证码 (8位)</label>
                                                <div className="flex items-center gap-3">
                                                    <Button type="button" onClick={handlePasteOtp} variant="ghost" className="h-6 px-0 text-muted-foreground/40 text-[10px] hover:bg-transparent hover:text-primary transition-all uppercase tracking-widest">
                                                        粘贴验证码
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        disabled={countdown > 0 || loading}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const form = e.currentTarget.closest('form');
                                                            if (form) handleSendCode(new FormData(form));
                                                        }}
                                                        variant="ghost"
                                                        className="h-6 px-0 text-primary italic text-[11px] hover:bg-transparent hover:text-primary/70 transition-all min-w-[60px] border-b border-primary/10 rounded-none"
                                                    >
                                                        {countdown > 0 ? `${countdown}s` : (otpSent ? '重新获取' : '获取验证码')}
                                                    </Button>
                                                </div>
                                            </div>
                                            <OtpInput otp={otp} setOtp={setOtp} />
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] p-4 rounded-none flex items-center gap-4 bg-destructive/[0.03] border-l-2 border-destructive text-destructive/80">
                                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                {error}
                            </motion.div>
                        )}

                        <motion.div variants={itemVariants} whileHover="hover" whileTap="tap" className="cursor-pointer">
                            <Button
                                type="submit"
                                disabled={loading || !!oauthLoading}
                                className="w-full h-16 bg-primary hover:bg-black text-white rounded-none font-bold tracking-[0.4em] uppercase transition-all duration-500 shadow-[0_20px_40px_-15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_25px_50px_-12px_rgba(var(--primary-rgb),0.4)] group relative overflow-hidden"
                            >
                                <motion.div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {loading ? (
                                    <HugeiconsIcon icon={Loader2} size={20} className="animate-spin mr-3 opacity-50" />
                                ) : (
                                    <span className="flex items-center z-10">
                                        {step === 'EMAIL' ? '下一步' : (authMode === 'REGISTER' ? '注册' : '登录')}
                                        {step === 'EMAIL' && <HugeiconsIcon icon={ArrowRight} size={16} className="ml-3 opacity-50 group-hover:translate-x-1.5 transition-transform duration-500" />}
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    </form>
                </div>
            </div>

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
