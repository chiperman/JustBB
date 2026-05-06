import { z } from "zod"

const isServer = typeof window === "undefined"

/**
 * 通用的 URL 校验与自动补全 Schema
 */
const urlSchema = z
  .string()
  .url()
  .or(
    z
      .string()
      .min(1)
      .transform((v) => (v.startsWith("http") ? v : `https://${v}`))
  )

/**
 * 环境变量 Schema 定义 (唯一真相)
 */
export const envSchema = z.object({
  // --- 核心变量 ---
  NEXT_PUBLIC_SUPABASE_URL: urlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // 服务端私密配置
  SUPABASE_SERVICE_ROLE_KEY: isServer
    ? z.string().min(1)
    : z.string().optional(),

  // --- 功能变量 ---
  NEXT_PUBLIC_SITE_URL: urlSchema.optional(),

  SUPABASE_PROJECT_REF: z.string().optional(),
  SUPABASE_MANAGEMENT_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * 获取并校验环境变量
 */
function validateEnv(): Env {
  // 智能处理 SITE_URL 的回退逻辑
  const runtimeEnv = {
    ...process.env,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_VERCEL_URL,
  }

  const parsed = envSchema.safeParse(runtimeEnv)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors

    console.error("⚠️ 环境变量配置错误:")
    Object.entries(errors).forEach(([field, messages]) => {
      console.error(`  - ${field}: ${messages?.join(", ")}`)
    })

    // 生产环境构建时强制拦截
    const isProd = process.env.NODE_ENV === "production"
    const isBuild = process.env.NEXT_PHASE === "phase-production-build"
    const shouldSkip = process.env.SKIP_ENV_VALIDATION === "true"

    if (isServer && isProd && isBuild && !shouldSkip) {
      throw new Error("致命错误: 生产环境缺失核心环境变量")
    }

    return runtimeEnv as unknown as Env
  }

  return parsed.data
}

export const env = validateEnv()
