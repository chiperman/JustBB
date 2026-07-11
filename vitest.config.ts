import { defineConfig } from "vitest/config"
import { existsSync } from "node:fs"
import path from "path"

// 使用 Node 20+ 原生特性加载环境变量
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local")
}

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**"],
    include: ["src/**/*.test.{ts,tsx}", "cli/**/*.test.ts"],
    env: process.env,
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
