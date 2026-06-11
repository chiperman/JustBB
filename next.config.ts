import type { NextConfig } from "next"
import "./src/lib/env" // 构建时自动执行校验

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**/*" }],
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
