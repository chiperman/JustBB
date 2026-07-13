"use client"

import { useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { useLayout } from "@/state/LayoutContext"
import { useUser } from "@/state/UserContext"
import { LoginPanel } from "@/features/auth/components/LoginPanel"

type LoginTransitionWrapperProps = {
  children: React.ReactNode
}

const PANEL_TRANSITION = {
  type: "tween" as const,
  duration: 0.45,
  ease: [0.16, 1, 0.3, 1] as const, // easeOutExpo
}

const FADE_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
}

const HOME_TRANSITION_VARIANTS: Variants = {
  home: {
    scale: 1,
    x: "0%",
    opacity: 1,
    willChange: "transform, opacity",
    transition: PANEL_TRANSITION,
  },
  split: {
    scale: 0.9,
    x: "45%",
    opacity: 1,
    willChange: "transform, opacity",
    transition: PANEL_TRANSITION,
  },
}

const LOGIN_PANEL_VARIANTS: Variants = {
  home: {
    x: "-100%",
    scale: 0.9,
    opacity: 1,
    borderRadius: "24px",
    zIndex: -1,
    transition: PANEL_TRANSITION,
    willChange: "transform, opacity",
  },
  split: {
    x: "0%",
    scale: 0.9,
    opacity: 1,
    zIndex: 20,
    borderRadius: "24px",
    transition: {
      ...PANEL_TRANSITION,
      delay: 0.04,
    },
    willChange: "transform, opacity",
  },
}

const MOBILE_LOGIN_PANEL_VARIANTS: Variants = {
  home: {
    y: "100%",
    x: "0%",
    opacity: 1,
    borderRadius: "30px 30px 0 0",
    transition: {
      type: "spring",
      damping: 28,
      stiffness: 260,
    },
  },
  split: {
    y: "0%",
    x: "0%",
    opacity: 1,
    borderRadius: "30px 30px 0 0",
    transition: {
      type: "spring",
      damping: 28,
      stiffness: 260,
    },
  },
}

const MOBILE_BACKDROP_VARIANTS: Variants = {
  home: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  split: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export function LoginTransitionWrapper({
  children,
}: LoginTransitionWrapperProps): React.ReactElement {
  const { viewMode, setViewMode } = useLayout()
  const { user } = useUser()
  const isSplitView = viewMode === "SPLIT_VIEW"
  const variant = isSplitView ? "split" : "home"
  const homeCardBackgroundColor = isSplitView ? "var(--card)" : "var(--background)"
  const draftOpacity = !user && isSplitView ? 0.025 : 0.05
  const creditOpacity = !user && isSplitView ? 0.012 : 0.03
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth < 768
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const isMobileMode = isMobile

  return (
    <div className="fixed inset-0 isolate overflow-hidden bg-background paper-texture">
      {/* Background Decorative Text */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <motion.span
          animate={{ opacity: draftOpacity }}
          transition={FADE_TRANSITION}
          className="absolute top-[10%] left-[5%] text-[10vw] font-editorial italic text-foreground"
        >
          JustMemo Draft
        </motion.span>
        <motion.span
          animate={{ opacity: creditOpacity }}
          transition={FADE_TRANSITION}
          className="absolute bottom-[15%] right-[10%] text-[4vw] font-editorial text-foreground"
        >
          with ❤️ by chiperman
        </motion.span>
      </div>

      {isMobileMode ? (
        <>
          <motion.div
            variants={HOME_TRANSITION_VARIANTS}
            initial="home"
            animate="home"
            className="absolute inset-0 z-10"
          >
            <div
              className="home-card-shell h-full w-full overflow-hidden border border-border/60"
              style={{
                backgroundColor: homeCardBackgroundColor,
              }}
            >
              <div className={cn("h-full", isSplitView && "pointer-events-none select-none")}>
                {children}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="home"
            animate={isSplitView ? "split" : "home"}
            variants={MOBILE_BACKDROP_VARIANTS}
            onClick={() => setViewMode("HOME_FOCUS")}
            className="fixed inset-0 z-[95] bg-black/35 backdrop-blur-[2px] md:hidden"
            style={{ pointerEvents: isSplitView ? "auto" : "none" }}
          />

          <motion.div
            initial="home"
            animate={isSplitView ? "split" : "home"}
            variants={MOBILE_LOGIN_PANEL_VARIANTS}
            className="md:hidden fixed inset-x-0 bottom-0 z-[96] flex items-end justify-center px-0 pb-0"
            style={{ pointerEvents: isSplitView ? "auto" : "none" }}
          >
            <div className="relative mx-auto h-auto max-h-[min(88dvh,calc(100dvh-16px))] w-full max-w-[520px] flex flex-col overflow-hidden rounded-t-[30px] border border-border bg-card px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-12px_38px_rgba(0,0,0,0.14)]">
              <div className="mb-3 flex items-center justify-center">
                <span className="h-1.5 w-11 rounded-full bg-muted-foreground/25" />
              </div>
              <div className="px-1 pb-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <LoginPanel />
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <div className="relative w-full h-full z-10">
          {/* Home Panel (Main Content) */}
          <motion.div
            variants={HOME_TRANSITION_VARIANTS}
            initial="home"
            animate={variant}
            className="absolute inset-0 z-10 origin-center"
            style={{
              borderRadius: isSplitView ? 24 : 0,
            }}
          >
            {isSplitView && (
              <button
                type="button"
                aria-label="返回主视图"
                className="absolute inset-0 z-20 rounded-[24px] bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={() => setViewMode("HOME_FOCUS")}
              />
            )}
            <div
              className={cn(
                "home-card-shell h-full w-full overflow-hidden border border-border/60",
                isSplitView && "rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]"
              )}
              style={{
                borderRadius: "inherit",
                backgroundColor: homeCardBackgroundColor,
              }}
            >
              {/* Actual Home Page Content */}
              <div className={cn("h-full", isSplitView && "pointer-events-none select-none")}>
                {children}
              </div>
            </div>
          </motion.div>

          {/* Login Panel (Auth Form) - 50% 对称卡片 */}
          <motion.div
            variants={LOGIN_PANEL_VARIANTS}
            initial="home"
            animate={variant}
            className={cn(
              "login-card-shell fixed left-0 top-0 z-20 flex h-full w-[50%] items-center justify-center overflow-hidden rounded-[24px] border border-border/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] p-12",
              isSplitView ? "pointer-events-auto" : "pointer-events-none"
            )}
            style={{ backgroundColor: "var(--card)" }}
          >
            <div className="w-full max-w-[400px] pointer-events-auto">
              <LoginPanel />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
