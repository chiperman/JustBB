"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon as Menu } from "@hugeicons/core-free-icons"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface MobileMenuButtonProps {
  isOpen: boolean
  onClick: () => void
}

import { Button } from "@/shared/ui/button"

export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
  if (isOpen) return null

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-[80] rounded-2xl h-11 w-11 p-0 bg-background/92 shadow-sm backdrop-blur-md active:scale-95 transition-all"
      aria-label="打开菜单"
    >
      <HugeiconsIcon icon={Menu} size={20} aria-hidden="true" />
    </Button>
  )
}

interface MobileMenuOverlayProps {
  isOpen: boolean
  children: React.ReactNode
}

export function MobileMenuOverlay({ isOpen, children }: MobileMenuOverlayProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
            className="lg:hidden fixed inset-0 bg-background z-[60]"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* 菜单始终保持挂载：手机全屏，较宽视口保持抽屉宽度。 */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : "-100%",
          visibility: (isOpen ? "visible" : "hidden") as "visible" | "hidden",
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: "spring", damping: 32, stiffness: 250, mass: 0.9 }
        }
        className="lg:hidden fixed inset-0 z-[70] w-full overflow-hidden bg-background pointer-events-auto"
        style={{
          pointerEvents: isOpen ? "auto" : "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="移动端菜单"
      >
        {children}
      </motion.div>
    </>
  )
}

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return { isOpen, toggle, close, open }
}
