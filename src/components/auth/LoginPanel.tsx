'use client';

import React, { useState, useEffect, useRef } from 'react';
import { login, signup, signInWithOAuth, verifyOtp, checkUserExists } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, Github, Eye, EyeOff, ArrowRight, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useLoginMode } from '@/context/LoginModeContext';
// import './themes.css'; // Assuming themes.css is global or handled via import in layout

export function LoginPanel() {
    const { viewMode, setViewMode } = useLoginMode();
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
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0, // 0-4
        label: '',
        color: 'bg-muted/20',
        metRequirements: {
            length: false,
            upper: false,
            lower: false,
            number: false,
            symbol: false
        }
    });

    // Timer effect
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const checkPasswordStrength = (pass: string) => {
        const requirements = {
            length: pass.length >= 8,
            upper: /[A-Z]/.test(pass),
            lower: /[a-z]/.test(pass),
            number: /[0-9]/.test(pass),
            symbol: /[^A-Za-z0-9]/.test(pass)
        };

        const score = Object.values(requirements).filter(Boolean).length;
        let label = '';
        let color = 'bg-muted/20';

        if (pass.length === 0) {
            label = '';
        } else if (score <= 2) {
            label = '弱';
            color = 'bg-red-400';
        } else if (score <= 4) {
            label = '中';
            color = 'bg-yellow-400';
        } else {
            label = '强';
            color = 'bg-green-400';
        }

        setPasswordStrength({ score, label, color, metRequirements: requirements });
    };

    useEffect(() => {
        if (authMode === 'REGISTER') {
            checkPasswordStrength(password);
        }
    }, [password, authMode]);

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
            setOtp(['', '', '', '', '', '']);
            setPasswordStrength({
                score: 0,
                label: '',
                color: 'bg-muted/20',
                metRequirements: {
                    length: false,
                    upper: false,
                    lower: false,
                    number: false,
                    symbol: false
                }
            });
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
            const { exists, error: checkError } = await checkUserExists(email);
            if (checkError) {
                setError(checkError);
                setLoading(false);
                return;
            }

            setAuthMode(exists ? 'LOGIN' : 'REGISTER');
            setStep('AUTH');
        } catch (err) {
            setError('检查用户状态失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const handleSendCode = async (formData: FormData) => {
        setLoading(true);
        setError(null);
        const password = formData.get('password') as string;

        // Basic password validation
        if (!password || password.length < 8) {
            setError('密码至少需要8位字符');
            setLoading(false);
            return;
        }

        // Multi-requirement check for registration
        const requirements = {
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            symbol: /[^A-Za-z0-9]/.test(password)
        };

        if (!requirements.upper || !requirements.lower || !requirements.number || !requirements.symbol) {
            setError('密码必须包含大小写字母、数字及特殊字符');
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
            const otp = formData.get('otp') as string;
            const password = formData.get('password') as string;

            // Re-verify password strength on final submit just in case
            if (!password || password.length < 8 || passwordStrength.score < 5) {
                setError('请完善密码复杂度要求');
                setLoading(false);
                return;
            }

            if (!otpSent) {
                // User clicked "Send Code" or main button while OTP not sent
                // Wait, UI should split buttons.
                // If we have a single submit button logic, it gets complex.
                // Let's assume this handles the final "Confirm" or "Send".
                // Actually, for better UX, let's keep separate handlers for Send Code button.
                // This main submit is for the final action.

                if (!otp) {
                    await handleSendCode(formData);
                    return;
                }
            }

            // Verify OTP
            if (!otp || otp.length !== 6) {
                setError('请输入6位验证码');
                setLoading(false);
                return;
            }

            const result = await verifyOtp(email, otp);
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
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 26,
                mass: 1
            },
            zIndex: -1
        },
        card: {
            x: '-100%',
            scale: 0.9,
            opacity: 0,
            borderRadius: '24px',
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 26,
                mass: 1
            },
            zIndex: -1
        },
        split: {
            x: '0%', // Occupy left half
            scale: 0.9,
            opacity: 1,
            zIndex: 20,
            borderRadius: '24px',
            backgroundColor: 'var(--background)', // Ensure opacity
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // Matching shadow
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 24,
                staggerChildren: 0.05, // physics-no-excessive-stagger
                delayChildren: 0.1
            }
        }
    };

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Handle paste
            const pastedData = value.slice(0, 6).split('');
            const newOtp = [...otp];
            pastedData.forEach((char, i) => {
                if (index + i < 6) newOtp[index + i] = char;
            });
            setOtp(newOtp);
            // Focus last filled or next
            const nextIndex = Math.min(index + pastedData.length, 5);
            otpInputs.current[nextIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
            },
        },
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
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] contrast-125 brightness-100 z-0">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>
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
                        <motion.div whileTap={{ scale: 0.96 }}>
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin('github')}
                                disabled={!!oauthLoading}
                                aria-label="Sign in with GitHub"
                                className="w-full h-14 group cursor-pointer transition-all duration-300 border-foreground/10 hover:bg-foreground/[0.03] rounded-none border-0 border-b bg-transparent"
                            >
                                {oauthLoading === 'github' ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                ) : (
                                    <Github className="w-5 h-5 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                )}
                                <span className="font-sans font-bold tracking-widest text-[11px] uppercase">GitHub</span>
                            </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.96 }}>
                            <Button
                                variant="outline"
                                onClick={() => handleOAuthLogin('google')}
                                disabled={!!oauthLoading}
                                aria-label="Sign in with Google"
                                className="w-full h-14 group cursor-pointer transition-all duration-300 border-foreground/10 hover:bg-foreground/[0.03] rounded-none border-0 border-b bg-transparent"
                            >
                                {oauthLoading === 'google' ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                ) : (
                                    <span className="mr-3 font-bold text-lg leading-none text-muted-foreground group-hover:text-primary transition-colors">G</span>
                                )}
                                <span className="font-sans font-bold tracking-widest text-[11px] uppercase">Google</span>
                            </Button>
                        </motion.div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full bg-black/5" />
                        </div>
                        <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-[0.3em]">
                            <span className="px-6 text-muted-foreground/30 font-sans bg-[#fdfcf9]">其他登录方式</span>
                        </div>
                    </motion.div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Step 1: Email Input */}
                        <motion.div variants={itemVariants} className="space-y-4">
                            <label
                                htmlFor="email"
                                className="block text-[12px] font-serif font-medium text-foreground/40 ml-1 italic"
                            >
                                电子邮箱
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/10 group-focus-within:text-primary transition-colors duration-500 z-10" />
                                <Input
                                    id="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (e.target.value && !isEmailValid) setIsEmailValid(true);
                                    }}
                                    placeholder="writer@example.com"
                                    readOnly={step === 'AUTH'}
                                    autoFocus
                                    style={{
                                        backgroundColor: 'transparent'
                                    }}
                                    className={`h-12 border-0 focus-visible:ring-0 transition-all duration-500 font-sans pl-8 rounded-none bg-transparent shadow-[0_1px_0_0_rgba(0,0,0,0.05)] focus:shadow-[0_2px_0_0_rgba(var(--primary-rgb),0.3)] ${step === 'AUTH' ? 'text-foreground/50 cursor-not-allowed opacity-60' : ''} ${!isEmailValid ? 'text-destructive focus:shadow-[0_2px_0_0_rgba(var(--destructive-rgb),0.5)]' : ''}`}
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
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                )}
                                <motion.div
                                    className="absolute bottom-0 left-0 h-[1px] bg-primary"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '100%' }}
                                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                />
                            </div>
                        </motion.div>

                        {/* Step 2: Password & OTP */}
                        <AnimatePresence mode="wait">
                            {step === 'AUTH' && (
                                <motion.div
                                    key="auth-fields"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-8"
                                >
                                    {/* Password Input */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <label
                                                htmlFor="password"
                                                className="block text-[12px] font-serif font-medium text-foreground/40 italic"
                                            >
                                                {authMode === 'REGISTER' ? '设置登录密码' : '安全密码'}
                                            </label>
                                            {authMode === 'LOGIN' && (
                                                <Link
                                                    href="/forgot-password"
                                                    className="text-[10px] font-bold text-muted-foreground/20 hover:text-primary transition-colors font-sans uppercase tracking-widest border-b border-muted-foreground/10 pb-0.5"
                                                >
                                                    忘记了吗？
                                                </Link>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/10 group-focus-within:text-primary transition-colors duration-500 z-10" />
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder={authMode === 'REGISTER' ? "至少8位，包含大小写、数字及符号" : "••••••••"}
                                                style={{
                                                    backgroundColor: 'transparent'
                                                }}
                                                className="h-12 border-0 focus-visible:ring-0 transition-all duration-500 font-sans pl-8 pr-12 rounded-none bg-transparent placeholder:text-foreground/20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] focus:shadow-[0_2px_0_0_rgba(var(--primary-rgb),0.3)]"
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
                                                aria-label={showPassword ? "收起密码" : "显示密码"}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/20 hover:text-primary transition-colors duration-500 focus:outline-none cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {/* Enhanced Password Strength Indicator - Relative Flow */}
                                        {authMode === 'REGISTER' && password && (
                                            <div className="pt-4 pb-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 border-l-2 border-primary/5 pl-4 ml-1">
                                                <div className="flex gap-1.5 h-1.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <div
                                                            key={s}
                                                            className={`flex-1 transition-all duration-700 rounded-full ${s <= passwordStrength.score ? passwordStrength.color : 'bg-foreground/[0.03]'}`}
                                                        />
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                                    <RequirementItem met={passwordStrength.metRequirements.length} label="至少 8 位" />
                                                    <RequirementItem met={passwordStrength.metRequirements.upper && passwordStrength.metRequirements.lower} label="包含大小写" />
                                                    <RequirementItem met={passwordStrength.metRequirements.number} label="包含数字" />
                                                    <RequirementItem met={passwordStrength.metRequirements.symbol} label="特殊符号" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Deconstructed OTP Input Group */}
                                    {authMode === 'REGISTER' && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between ml-1">
                                                <label
                                                    htmlFor="otp-0"
                                                    className="block text-[12px] font-serif font-medium text-foreground/40 italic"
                                                >
                                                    安全验证码 (6位)
                                                </label>
                                                <motion.div whileTap={{ scale: 0.95 }}>
                                                    <Button
                                                        type="button"
                                                        disabled={countdown > 0 || loading}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const form = e.currentTarget.closest('form');
                                                            if (form) {
                                                                const formData = new FormData(form);
                                                                handleSendCode(formData);
                                                            }
                                                        }}
                                                        variant="ghost"
                                                        className="h-6 px-0 text-primary font-serif italic text-[11px] hover:bg-transparent hover:text-primary/70 transition-all min-w-[60px] border-b border-primary/10 rounded-none"
                                                    >
                                                        {countdown > 0 ? `${countdown}s` : (otpSent ? '重新获取' : '获取验证码')}
                                                    </Button>
                                                </motion.div>
                                            </div>
                                            <div className="grid grid-cols-6 gap-3 py-4">
                                                {otp.map((digit, index) => (
                                                    <div
                                                        key={`otp-${index}`}
                                                        className="relative"
                                                    >
                                                        <Input
                                                            ref={(el) => { otpInputs.current[index] = el; }}
                                                            id={`otp-${index}`}
                                                            type="text"
                                                            inputMode="numeric"
                                                            pattern="[0-9]*"
                                                            maxLength={1}
                                                            value={digit}
                                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                            className="w-full aspect-square h-auto text-center text-2xl font-mono border-[1.5px] border-foreground/10 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 focus-visible:ring-0 transition-all duration-200 rounded-none bg-white p-0 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.08)] flex items-center justify-center m-0"
                                                            autoComplete="one-time-code"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground/30 font-sans ml-1 text-center italic">
                                                验证码已发送至您的加密邮箱
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

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

                        <motion.div
                            variants={itemVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="cursor-pointer"
                        >
                            <Button
                                type="submit"
                                disabled={loading || !!oauthLoading}
                                className="w-full h-16 bg-primary hover:bg-black text-white rounded-none font-bold tracking-[0.4em] uppercase transition-all duration-500 shadow-[0_20px_40px_-15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_25px_50px_-12px_rgba(var(--primary-rgb),0.4)] group relative overflow-hidden"
                            >
                                <motion.div
                                    className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-3 opacity-50" />
                                ) : (
                                    <span className="flex items-center z-10">
                                        {step === 'EMAIL' ? '验证邮箱' : (authMode === 'REGISTER' ? '完成注册' : '进入实验室')}
                                        {step === 'EMAIL' && <ArrowRight className="ml-3 w-4 h-4 opacity-50 group-hover:translate-x-1.5 transition-transform duration-500" />}
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

function RequirementItem({ met, label }: { met: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2 group">
            <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${met ? 'bg-green-500/10 text-green-600 scale-110 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-foreground/[0.03] text-muted-foreground/20'}`}>
                {met ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-current opacity-40" />}
            </div>
            <span className={`text-[10px] font-sans font-bold uppercase tracking-wider transition-colors duration-300 ${met ? 'text-green-600/80' : 'text-muted-foreground/30'}`}>{label}</span>
        </div>
    );
}
