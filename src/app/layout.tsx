import type { Metadata } from "next"
import { ThemeProvider } from "@/shared/providers/ThemeProvider"
import { AgentationWrapper } from "@/shared/providers/AgentationWrapper"
import { env } from "@/lib/env"
import "./globals.css"

// 强制执行环境校验
if (typeof window === "undefined") {
  void env
}

export const metadata: Metadata = {
  title: "JustMemo - 碎片化人文记录",
  description: "一款追求人文质感与极致隐私的碎片化记录工具。",
  manifest: "/manifest.json",
}

import { PWARegistration } from "@/shared/providers/PWARegistration"
import { Toaster } from "@/shared/ui/toaster"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { EnvErrorBanner } from "@/shared/ui/EnvErrorBanner"
import { Suspense } from "react"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        {/* CartoDB 瓦片 CDN 预连接，加速地图首屏加载 */}
        <link
          rel="preconnect"
          href="https://a.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://b.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://c.basemaps.cartocdn.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            {children}
            <Toaster />
            <EnvErrorBanner />
            <PWARegistration />
            <Suspense fallback={null}>
              <AgentationWrapper />
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
