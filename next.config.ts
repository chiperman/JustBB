import type { NextConfig } from "next"
import "./src/lib/env" // 构建时自动执行校验

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      { protocol: "https", hostname: "**/*" }, // 允许所有 HTTPS 图片域名（R2 / 外部链接）
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
