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
}

export function SmartImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackClassName,
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
        "relative overflow-hidden bg-muted/20 flex items-center justify-center",
        containerClassName
      )}
    >
      <AnimatePresence mode="popLayout">
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-full h-full animate-pulse bg-muted/40" />
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground/40",
              fallbackClassName
            )}
          >
            <HugeiconsIcon
              icon={Image01Icon}
              size={32}
              strokeWidth={1.5}
              className="opacity-50"
            />
            <span className="text-[10px] font-medium tracking-wider uppercase">
              图片不可用
            </span>
          </motion.div>
        )}

        {src && status !== "error" && (
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: status === "success" ? 1 : 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
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
      </AnimatePresence>
    </div>
  )
}
