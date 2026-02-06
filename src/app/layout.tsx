import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AgentationWrapper } from "@/components/AgentationWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "JustMemo - 碎片化人文记录",
  description: "一款追求人文质感与极致隐私的碎片化记录工具。",
  manifest: "/manifest.json",
};

import { PWARegistration } from "@/components/providers/PWARegistration";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className="antialiased font-serif">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <PWARegistration />
          <AgentationWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
