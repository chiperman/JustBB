"use client"

import { Toaster as SileoToaster } from "sileo"

export function Toaster() {
  return (
    <SileoToaster
      position="bottom-right"
      offset={{
        bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
        right: "0.75rem",
      }}
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
