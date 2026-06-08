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
        "absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-muted-foreground/40 z-10 select-none bg-[linear-gradient(45deg,rgba(29,29,27,0.015)_25%,transparent_25%,transparent_50%,rgba(29,29,27,0.015)_50%,rgba(29,29,27,0.015)_75%,transparent_75%,transparent)] dark:bg-[linear-gradient(45deg,rgba(255,255,255,0.01)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.01)_50%,rgba(255,255,255,0.01)_75%,transparent_75%,transparent)] bg-[size:16px_16px]",
        isFullPage && "bg-muted/10 backdrop-blur-sm",
        className
      )}
    >
      <div className="absolute inset-2 border border-dashed border-border/30 rounded-lg pointer-events-none" />
      <HugeiconsIcon
        icon={Image01Icon}
        size={isFullPage ? 36 : 24}
        strokeWidth={1.2}
        className="opacity-30 text-muted-foreground/50"
      />
      <span
        className={cn(
          "font-mono tracking-[0.3em] uppercase text-center text-muted-foreground/40",
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
          <ImageErrorState
            isFullPage={isFullPage}
            className={fallbackClassName}
          />
        )}
      </AnimatePresence>

      {src && (
        <motion.div
          key="image"
          initial={{ opacity: 0 }}
          animate={{ opacity: status === "success" ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn("w-full h-full", status !== "success" && "invisible")}
        >
          <img
            src={src}
            alt={alt}
            onLoad={() => setStatus("success")}
            onError={() => setStatus("error")}
            className={cn(
              "w-full h-full transition-transform duration-700",
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
