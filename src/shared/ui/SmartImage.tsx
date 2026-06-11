"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Image01Icon } from "@hugeicons/core-free-icons"

interface SmartImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "onDrag" | "onDragStart" | "onDragEnd"
> {
  containerClassName?: string
  fallbackClassName?: string
  isFullPage?: boolean
}

function ImageErrorState({
  isFullPage = false,
  className,
}: {
  isFullPage?: boolean
  className?: string
}) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "absolute inset-0 z-10 flex select-none flex-col items-center justify-center gap-2.5 overflow-hidden p-4 text-muted-foreground/45",
        "bg-[#f6f5f4]/75 backdrop-blur-md backdrop-saturate-125",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-18px_40px_rgba(29,29,27,0.035)]",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.62),rgba(255,255,255,0.18)_44%,rgba(29,29,27,0.025)_100%)]",
        "after:absolute after:inset-0 after:bg-[repeating-radial-gradient(circle_at_18%_22%,rgba(29,29,27,0.035)_0_1px,transparent_1px_4px),linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0)_48%,rgba(29,29,27,0.04))] after:opacity-35",
        "dark:bg-background/58 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-18px_40px_rgba(0,0,0,0.28)] dark:before:bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_44%,rgba(0,0,0,0.18)_100%)] dark:after:bg-[repeating-radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.05)_0_1px,transparent_1px_4px),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0)_48%,rgba(0,0,0,0.18))]",
        isFullPage && "bg-background/65",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-2 rounded-lg shadow-[inset_0_0_0_1px_rgba(29,29,27,0.055),inset_0_0_30px_rgba(255,255,255,0.34)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_0_30px_rgba(255,255,255,0.04)]" />
      <HugeiconsIcon
        icon={Image01Icon}
        size={isFullPage ? 36 : 24}
        strokeWidth={1.2}
        className="relative z-10 text-muted-foreground/45"
      />
      <span
        className={cn(
          "relative z-10 text-center font-mono uppercase tracking-[0.3em] text-muted-foreground/45",
          isFullPage ? "text-[10px]" : "text-[9px]"
        )}
      >
        图片不可用
      </span>
    </motion.div>
  )
}

export function SmartImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackClassName,
  isFullPage,
  ...props
}: SmartImageProps) {
  const [status, setStatus] = React.useState<"loading" | "error" | "success">(
    src ? "loading" : "error"
  )

  // 当 src 变化时重置状态
  React.useEffect(() => {
    if (src) {
      setStatus("loading")
    } else {
      setStatus("error")
    }
  }, [src])

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/20 flex items-center justify-center min-h-[140px]",
        containerClassName
      )}
    >
      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="w-full h-full animate-pulse bg-muted/40" />
          </motion.div>
        )}

        {status === "error" && (
          <ImageErrorState isFullPage={isFullPage} className={fallbackClassName} />
        )}
      </AnimatePresence>

      {src && (
        <motion.div
          key="image"
          initial={{ opacity: 0 }}
          animate={{ opacity: status === "success" ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "w-full",
            containerClassName?.includes("h-auto") ? "h-auto" : "h-full",
            status !== "success" && "invisible"
          )}
        >
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onLoad={() => setStatus("success")}
            onError={() => setStatus("error")}
            className={cn(
              "w-full transition-transform duration-700",
              containerClassName?.includes("h-auto") ? "h-auto" : "h-full",
              status === "success" ? "scale-100" : "scale-105",
              className
            )}
            {...props}
          />
        </motion.div>
      )}
    </div>
  )
}
