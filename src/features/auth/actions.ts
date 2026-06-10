"use server"

import { getClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Provider } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { ActionResponse } from "@/server/actions/shared/types"
import { UserInfo, UserRole } from "@/types/auth"
import { loginSchema, signupSchema, verifyOtpSchema } from "./schemas"

export async function login(
  formData: FormData
): Promise<ActionResponse<{ user: UserInfo }>> {
  const rawData = Object.fromEntries(formData.entries())
  const validation = loginSchema.safeParse(rawData)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  const { email, password } = validation.data
  const supabase = await getClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("[Auth] Login failed:", error.message)
    return { success: false, error: "邮箱或密码错误" }
  }

  if (!data.user) {
    return { success: false, error: "登录失败" }
  }

  const userInfo: UserInfo = {
    id: data.user.id,
    email: data.user.email,
    created_at: data.user.created_at,
    role: (data.user.app_metadata?.role as UserRole) || "user",
  }

  revalidatePath("/", "layout")
  return { success: true, error: null, data: { user: userInfo } }
}

/**
 * Validate password against all 5 criteria used in PasswordStrength.tsx.
 * Returns a list of failed criteria; empty means password is valid.
 */
function validatePassword(password: string): string[] {
  const failed: string[] = []
  if (password.length < 8) failed.push("至少 8 位")
  if (!/[A-Z]/.test(password)) failed.push("至少 1 个大写字母")
  if (!/[a-z]/.test(password)) failed.push("至少 1 个小写字母")
  if (!/[0-9]/.test(password)) failed.push("至少 1 位数字")
  if (!/[^A-Za-z0-9]/.test(password)) failed.push("至少 1 个特殊符号")
  return failed
}

export async function signup(formData: FormData): Promise<ActionResponse> {
  const rawData = Object.fromEntries(formData.entries())
  const validation = signupSchema.safeParse(rawData)

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  const { email, password } = validation.data

  const failed = validatePassword(password)
  if (failed.length > 0) {
    return {
      success: false,
      error: `密码不符合要求：${failed.join("、")}。`,
    }
  }

  const supabase = await getClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    console.error("[Auth] Signup failed:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function verifyOtp(
  email: string,
  code: string
): Promise<ActionResponse<{ user: UserInfo }>> {
  const validation = verifyOtpSchema.safeParse({ email, code })
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message }
  }

  const supabase = await getClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "signup",
  })

  if (error) {
    console.error("[Auth] OTP Verification failed:", error.message)
    return { success: false, error: "验证码错误或已过期" }
  }

  if (!data.user) {
    return { success: false, error: "验证失败" }
  }

  const userInfo: UserInfo = {
    id: data.user.id,
    email: data.user.email,
    created_at: data.user.created_at,
    role: (data.user.app_metadata?.role as UserRole) || "user",
  }

  revalidatePath("/", "layout")
  return { success: true, error: null, data: { user: userInfo } }
}

export async function signInWithOAuth(
  provider: Provider
): Promise<ActionResponse> {
  const supabase = await getClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error("[Auth] OAuth failed:", error.message)
    return { success: false, error: "三方登录初始化失败" }
  }

  if (data.url) redirect(data.url)
  return { success: true, error: null }
}

export async function logout(): Promise<ActionResponse> {
  const supabase = await getClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  return { success: true, error: null }
}

export async function getCurrentUser(): Promise<UserInfo | null> {
  const supabase = await getClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    role: user.app_metadata?.role as UserRole | undefined,
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id ?? null
}

export async function isAuthenticated() {
  return (await getCurrentUserId()) !== null
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === "admin"
}

export async function sendPasswordResetEmail(
  email: string
): Promise<ActionResponse> {
  const supabase = await getClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  if (error) {
    console.error("[Auth] Reset email failed:", error.message)
    return { success: false, error: "发送重置邮件失败" }
  }

  return { success: true, error: null }
}

export async function updatePassword(
  password: string
): Promise<ActionResponse> {
  const failed = validatePassword(password)
  if (failed.length > 0) {
    return {
      success: false,
      error: `密码不符合要求：${failed.join("、")}。`,
    }
  }

  const supabase = await getClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error("[Auth] Password update failed:", error.message)
    return { success: false, error: "修改密码失败" }
  }

  return { success: true, error: null }
}
