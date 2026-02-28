import type { NextConfig } from "next";

// 在构建开始前执行环境变量校验 (Build-time Gate)
if (process.env.NODE_ENV !== 'development' && process.env.SKIP_ENV_VALIDATION !== 'true') {
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missing = requiredEnv.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('\x1b[31m❌ 环境变量校验失败 (Build-time Gate):\x1b[0m');
    missing.forEach(k => console.error(`  - 缺失: ${k}`));
    console.error('\x1b[33m请检查 .env.local 或 CI 环境配置。\x1b[0m');
    throw new Error('缺失必要的环境变量，构建已中止。');
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
