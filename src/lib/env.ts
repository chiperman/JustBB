import { z } from 'zod';

const isServer = typeof window === 'undefined';

/**
 * 环境变量校验 Schema
 * 包含应用运行所需的最小关键配置集
 */
const envSchema = z.object({
    // --- 强制项 (必须存在，否则构建/启动拦截) ---
    // Supabase 基础配置
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // 服务端私密配置 (Service Role) 客户端验证时跳过强制
    SUPABASE_SERVICE_ROLE_KEY: isServer ? z.string().min(1) : z.string().optional(),

    // --- 可选项 (有默认逻辑或回退机制) ---
    // 应用访问 URL (重定向用)
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    
    // Supabase 管理 API (用量统计增强用)
    SUPABASE_PROJECT_REF: z.string().optional(),
    SUPABASE_MANAGEMENT_API_KEY: z.string().optional(),
});

// 导出解析后的环境变量类型
export type Env = z.infer<typeof envSchema>;

/**
 * 执行全量环境变量校验
 * 失败时抛出友好错误并中止进程
 */
export function validateEnv() {
    // 显式构造对象，确保 Webpack/Turbopack 能对 NEXT_PUBLIC_ 开头的变量进行静态替换
    const envObj = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        SUPABASE_PROJECT_REF: process.env.SUPABASE_PROJECT_REF,
        SUPABASE_MANAGEMENT_API_KEY: process.env.SUPABASE_MANAGEMENT_API_KEY,
    };

    const parsed = envSchema.safeParse(envObj);

    if (!parsed.success) {
        console.error('❌ 环境变量校验失败:');
        const errors = parsed.error.flatten().fieldErrors;
        Object.entries(errors).forEach(([field, messages]) => {
            console.error(`  - ${field}: ${messages?.join(', ')}`);
        });

        // 只要不是开发环境（例如构建阶段或生产运行阶段），缺失变量就是致命的
        if (process.env.NODE_ENV !== 'development' && process.env.SKIP_ENV_VALIDATION !== 'true') {
            console.error('致命错误: 非开发环境缺失必要环境变量，构建/启动已中止。');
            throw new Error('缺失必要的环境变量，构建/启动已中止。');
        }

        if (process.env.SKIP_ENV_VALIDATION === 'true') {
            console.warn('⚠️ 警告: 环境变量校验失败，但在 SKIP_ENV_VALIDATION 模式下继续执行。');
        }
    }

    return parsed.data as Env;
}

// 自动执行校验 (Singleton pattern for environment validation)
export const env = validateEnv();
