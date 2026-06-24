"use client"

import { useState, memo } from "react"
import { logout } from "@/features/auth/actions"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Login03Icon as LogIn,
  Logout03Icon as LogOut,
  UserIcon as User,
  Loading01Icon as Loader2,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { useUser } from "@/state/UserContext"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/shared/ui/skeleton"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"

export const UserStatus = memo(function UserStatus({
  isCollapsed = false,
}: {
  isCollapsed?: boolean
}) {
  const { user, loading, setUser } = useUser()
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoggingOut(true)
    setUser(null)
    await logout()
    setLoggingOut(false)
    router.refresh()
  }

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={cn("space-y-2", isCollapsed ? "flex flex-col items-center" : "")}
        >
          <Skeleton
            className={cn(
              "h-[34px] rounded border border-border/50",
              isCollapsed ? "w-8" : "w-full"
            )}
          />
          <Skeleton className={cn("h-[40px] rounded", isCollapsed ? "w-8" : "w-full")} />
        </motion.div>
      ) : user ? (
        <motion.div
          key="user"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className={cn("space-y-2", isCollapsed ? "flex flex-col items-center" : "")}
        >
          {(() => {
            const statusInfo = (
              <div
                className={cn(
                  "flex items-center gap-2 p-2 bg-muted/40 rounded border border-border/50 group/status transition-all",
                  isCollapsed ? "justify-center w-10 h-10" : "w-full"
                )}
              >
                <HugeiconsIcon
                  icon={User}
                  size={16}
                  className={cn(
                    "shrink-0",
                    user.role === "admin" ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {!isCollapsed && (
                  <span className="text-xs text-muted-foreground truncate flex-1 font-medium">
                    {user.email} {user.role === "admin" ? "(管理员)" : "(普通用户)"}
                  </span>
                )}
              </div>
            )

            const logoutButton = (
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={loggingOut}
                className={cn(
                  "flex items-center justify-start gap-2 h-auto py-2.5 px-2.5 rounded hover:bg-accent text-muted-foreground font-normal active:scale-95 transition-all",
                  isCollapsed ? "justify-center px-0 w-10 h-10" : "w-full",
                  loggingOut && "opacity-50 cursor-not-allowed"
                )}
                aria-label="退出登录"
              >
                {loggingOut ? (
                  <HugeiconsIcon icon={Loader2} size={16} className="animate-spin" />
                ) : (
                  <HugeiconsIcon icon={LogOut} size={16} />
                )}
                {!isCollapsed && <span>退出登录</span>}
              </Button>
            )

            return (
              <>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{statusInfo}</TooltipTrigger>
                    <TooltipContent side="right">
                      {user.email} {user.role === "admin" ? "(管理员)" : ""}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  statusInfo
                )}

                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{logoutButton}</TooltipTrigger>
                    <TooltipContent side="right">退出登录</TooltipContent>
                  </Tooltip>
                ) : (
                  logoutButton
                )}
              </>
            )
          })()}
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="w-full"
        >
          {(() => {
            const loginLink = (
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded hover:bg-accent transition-all text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                  isCollapsed ? "justify-center w-10 h-10 px-0" : "w-full"
                )}
              >
                <HugeiconsIcon icon={LogIn} size={16} />
                {!isCollapsed && <span>管理员登录</span>}
              </Link>
            )

            return isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{loginLink}</TooltipTrigger>
                <TooltipContent side="right">管理员登录</TooltipContent>
              </Tooltip>
            ) : (
              loginLink
            )
          })()}
        </motion.div>
      )}
    </AnimatePresence>
  )
})
