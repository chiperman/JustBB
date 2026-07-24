"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

import { resolveAppThemeColor } from "@/shared/lib/theme-colors"

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  React.useLayoutEffect(() => {
    const color = resolveAppThemeColor(resolvedTheme)
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = color
    })
  }, [resolvedTheme])

  return null
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  )
}
