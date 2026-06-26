"use client"

import { Toaster as SileoToaster } from "sileo"

export function Toaster() {
  return (
    <SileoToaster
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      theme="system"
      options={{
        duration: 6000,
        fill: "var(--popover)",
        roundness: 16,
        styles: {
          title: "text-foreground!",
          description: "text-muted-foreground!",
          badge: "bg-secondary! text-foreground!",
          button: "bg-secondary! text-foreground! hover:bg-accent!",
        },
      }}
    />
  )
}
