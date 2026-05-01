"use client"

import { motion, Variants } from "framer-motion"
import { cn } from "@/shared/lib/utils"
import { useLayout } from "@/state/LayoutContext"
import { useUser } from "@/state/UserContext"
import { LoginPanel } from "@/features/auth/components/LoginPanel"

type LoginTransitionWrapperProps = {
  children: React.ReactNode
}

const PANEL_TRANSITION = {
  type: "spring" as const,
  stiffness: 185,
  damping: 26,
  mass: 0.95,
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

export function LoginTransitionWrapper({
  children,
}: LoginTransitionWrapperProps): React.ReactElement {
  const { viewMode, setViewMode } = useLayout()
  const { user } = useUser()
  const isSplitView = viewMode === "SPLIT_VIEW"
  const variant = isSplitView ? "split" : "home"
  const homeCardBackgroundColor = isSplitView
    ? "var(--card)"
    : "var(--background)"
  const draftOpacity = !user && isSplitView ? 0.025 : 0.05
  const creditOpacity = !user && isSplitView ? 0.012 : 0.03

  return (
    <div className="fixed inset-0 isolate overflow-hidden bg-[#fdfcf9] paper-texture">
      {/* Background Decorative Text */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <motion.span
          animate={{ opacity: draftOpacity }}
          transition={FADE_TRANSITION}
          className="absolute top-[10%] left-[5%] text-[10vw] font-editorial italic text-black dark:text-white"
        >
          JustMemo Draft
        </motion.span>
        <motion.span
          animate={{ opacity: creditOpacity }}
          transition={FADE_TRANSITION}
          className="absolute bottom-[15%] right-[10%] text-[4vw] font-editorial text-black dark:text-white"
        >
          with ❤️ by chiperman
        </motion.span>
      </div>

      {/* Split View Container */}
      <div className="relative w-full h-full z-10">
        {/* Home Panel (Main Content) */}
        <motion.div
          variants={HOME_TRANSITION_VARIANTS}
          initial="home"
          animate={variant}
          className={cn(
            "absolute inset-0 z-10 origin-center",
            isSplitView && "cursor-pointer"
          )}
          style={{
            borderRadius: isSplitView ? 24 : 0,
          }}
          onClick={() => isSplitView && setViewMode("HOME_FOCUS")}
        >
          <div
            className={cn(
              "home-card-shell h-full w-full overflow-hidden border border-black/5 dark:border-white/5",
              isSplitView &&
                "rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]"
            )}
            style={{
              borderRadius: "inherit",
              backgroundColor: homeCardBackgroundColor,
            }}
          >
            {/* Actual Home Page Content */}
            <div
              className={cn(
                "h-full",
                isSplitView && "pointer-events-none select-none"
              )}
            >
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
            "login-card-shell fixed left-0 top-0 z-20 flex h-full w-[50%] items-center justify-center overflow-hidden rounded-[24px] border border-black/5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] p-12 dark:border-white/5",
            isSplitView ? "pointer-events-auto" : "pointer-events-none"
          )}
          style={{ backgroundColor: "var(--card)" }}
        >
          <div className="w-full max-w-[400px] pointer-events-auto">
            <LoginPanel />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
