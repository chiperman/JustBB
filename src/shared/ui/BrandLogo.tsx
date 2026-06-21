"use client"

import { cn } from "@/shared/lib/utils"

interface BrandLogoProps {
  className?: string
  pixelSize?: number
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      width="132"
      height="32"
      viewBox="0 0 132 32"
      className={cn("text-foreground", className)}
      aria-label="JustMemo"
      role="img"
    >
      <path
        d="M9.8 19.8C6.5 19.8 4.2 17.5 4.4 14.5C4.6 11.4 6.8 9.1 10 8.6C11.5 5 15.1 2.7 19.2 2.7C23.4 2.7 26.9 5 28.5 8.6C31.6 9.1 33.8 11.4 34 14.5C34.2 17.5 31.9 19.8 28.6 19.8M9.8 19.8C11.7 17.9 14.6 17.9 16.4 19.8M28.6 19.8C26.7 17.9 23.8 17.9 22 19.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19.2" cy="15.7" r="1.6" fill="currentColor" />
      <text
        x="43"
        y="21.5"
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="-0.2"
      >
        JustMemo
      </text>
    </svg>
  )
}
