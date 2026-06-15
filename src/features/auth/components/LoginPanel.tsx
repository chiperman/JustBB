"use client"

import { useState, useTransition, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { login, signup, verifyOtp, signInWithOAuth, sendPasswordResetEmail } from "../actions"
import { useToast } from "@/shared/hooks/use-toast"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Mail01Icon as Mail,
  LockIcon as Lock,
  ViewIcon as Eye,
  ViewOffSlashIcon as EyeOff,
  ArrowRight01Icon as ArrowRight,
  Loading03Icon as Loader2,
  GithubIcon,
  GoogleIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Separator } from "@/shared/ui/separator"
import { motion, Variants, AnimatePresence } from "framer-motion"
import { useLayout } from "@/state/LayoutContext"
import { OtpInput } from "./OtpInput"
import { PasswordStrength } from "./PasswordStrength"
import { useUser } from "@/state/UserContext"

export function LoginPanel() {
  const { setViewMode } = useLayout()
  const { user, setUser } = useUser()
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)

  const loginPasswordRef = useRef<HTMLInputElement>(null)
  const signupPasswordRef = useRef<HTMLInputElement>(null)

  // Common states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [step, setStep] = useState<"email" | "login" | "signup" | "otp">("email")
  const [otpCode, setOtpCode] = useState("")

  // Mirror PasswordStrength's criteria for button disabled state
  const passwordScore = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }, [password])

  const resetForm = () => {
    setStep("email")
    setEmail("")
    setPassword("")
    setOtpCode("")
    setShowPassword(false)
  }

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("email")
      setEmail("")
      setPassword("")
      setOtpCode("")
      setShowPassword(false)
    }
  }, [user])

  const handleEmailNext = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setPassword("")
    setShowPassword(false)
    setStep("login")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      login(formData).then((res) => {
        if (res.success && res.data) {
          toast({ title: "欢迎回来", description: "登录成功" })
          resetForm()
          setUser(res.data.user)
          setViewMode("HOME_FOCUS")
          setTimeout(() => router.refresh(), 180)
        } else {
          toast({
            title: "登录失败",
            description: res.error,
            variant: "destructive",
          })
        }
      })
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(() => {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      signup(formData).then((res) => {
        if (res.success) {
          setStep("otp")
        } else {
          toast({
            title: "注册失败",
            description: res.error,
            variant: "destructive",
          })
        }
      })
    })
  }

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return
    startTransition(() => {
      verifyOtp(email, otpCode).then((res) => {
        if (res.success && res.data) {
          toast({ title: "账号已激活", description: "欢迎加入 JustBB" })
          resetForm()
          setUser(res.data.user)
          setViewMode("HOME_FOCUS")
          setTimeout(() => router.refresh(), 180)
        } else {
          toast({
            title: "验证失败",
            description: res.error,
            variant: "destructive",
          })
        }
      })
    })
  }

  const handleOAuth = (provider: "github" | "google") => {
    startTransition(() => {
      signInWithOAuth(provider).catch((err) => {
        toast({
          title: "三方登录失败",
          description: String(err),
          variant: "destructive",
        })
      })
    })
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "提示", description: "请先输入您的邮箱地址" })
      return
    }
    startTransition(() => {
      sendPasswordResetEmail(email).then((res) => {
        if (res.success) {
          toast({
            title: "重置邮件已发送",
            description: "请前往您的邮箱查收重置链接",
          })
        } else {
          toast({
            title: "发送失败",
            description: res.error,
            variant: "destructive",
          })
        }
      })
    })
  }

  // Animation Variants
  const formVariants: Variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.form
            key="email"
            {...formVariants}
            onSubmit={handleEmailNext}
            className="space-y-4"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">开始使用</h3>
              <p className="text-xs text-muted-foreground">
                输入您的邮箱地址后继续登录，需要新账号可在下一步切换注册
              </p>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-3 text-muted-foreground/50">
                <HugeiconsIcon icon={Mail} size={16} />
              </div>
              <Input
                type="email"
                name="email"
                autoComplete="username"
                placeholder="name@example.com"
                className="h-11 border-border/70 bg-background pl-10 transition-all focus:border-primary/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <Button className="w-full h-11 gap-2 group" disabled={!email}>
              继续
              <HugeiconsIcon
                icon={ArrowRight}
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-background px-2 text-muted-foreground tracking-widest font-mono">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-10"
                type="button"
                onClick={() => handleOAuth("github")}
                disabled={isPending}
              >
                <HugeiconsIcon icon={GithubIcon} size={18} />
              </Button>
              <Button
                variant="outline"
                className="h-10"
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={isPending}
              >
                <HugeiconsIcon icon={GoogleIcon} size={18} />
              </Button>
            </div>
          </motion.form>
        )}

        {step === "login" && (
          <motion.form
            key="login"
            {...formVariants}
            onSubmit={handleLogin}
            className="space-y-4"
            onAnimationComplete={() => {
              loginPasswordRef.current?.focus()
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setStep("email")}
                type="button"
              >
                ← 修改邮箱
              </Button>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">欢迎回来</h3>
              <p className="text-[11px] font-mono text-primary/60 truncate">{email}</p>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground/50">
                  <HugeiconsIcon icon={Lock} size={16} />
                </div>
                <Input
                  ref={loginPasswordRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="您的密码"
                  className="h-11 border-border/70 bg-background pl-10 pr-10 transition-all focus:border-primary/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  <HugeiconsIcon icon={showPassword ? EyeOff : Eye} size={16} />
                </button>
              </div>
              <Button className="w-full h-11" disabled={isPending}>
                {isPending ? (
                  <HugeiconsIcon icon={Loader2} size={18} className="animate-spin" />
                ) : (
                  "登录"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => {
                  setPassword("")
                  setShowPassword(false)
                  setStep("signup")
                }}
                disabled={isPending}
              >
                还没有账号？创建账号
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  忘记密码？
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {step === "signup" && (
          <motion.form
            key="signup"
            {...formVariants}
            onSubmit={handleSignup}
            className="space-y-4"
            onAnimationComplete={() => {
              signupPasswordRef.current?.focus()
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setStep("email")}
                type="button"
              >
                ← 修改邮箱
              </Button>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">创建账号</h3>
              <p className="text-xs text-muted-foreground">为您的新账号设置一个安全的密码</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute left-3 top-3 text-muted-foreground/50">
                    <HugeiconsIcon icon={Lock} size={16} />
                  </div>
                  <Input
                    ref={signupPasswordRef}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="设置密码"
                    className="h-11 border-border/70 bg-background pl-10 pr-10 transition-all focus:border-primary/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    <HugeiconsIcon icon={showPassword ? EyeOff : Eye} size={16} />
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>
              <Button className="w-full h-11" disabled={isPending || passwordScore === 0}>
                {isPending ? (
                  <HugeiconsIcon icon={Loader2} size={18} className="animate-spin" />
                ) : (
                  "创建账号"
                )}
              </Button>
            </div>
          </motion.form>
        )}

        {step === "otp" && (
          <motion.div key="otp" {...formVariants} className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight">最后一步</h3>
              <p className="text-xs text-muted-foreground">
                我们已向 <span className="text-primary/80 font-medium">{email}</span> 发送了 6
                位验证码，请在下方输入：
              </p>
            </div>

            <div className="flex justify-center py-2">
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                disabled={isPending}
                onComplete={handleVerifyOtp}
              />
            </div>

            <div className="space-y-3">
              <Button
                className="w-full h-11"
                disabled={isPending || otpCode.length !== 6}
                onClick={handleVerifyOtp}
              >
                {isPending ? (
                  <HugeiconsIcon icon={Loader2} size={18} className="animate-spin" />
                ) : (
                  "验证并登录"
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setStep("signup")}
                disabled={isPending}
              >
                返回上一步
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
