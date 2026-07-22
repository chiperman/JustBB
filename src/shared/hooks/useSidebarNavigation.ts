"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@/state/UserContext"
import { useLayout } from "@/state/LayoutContext"
import { NAVIGATION_CONFIG } from "@/config/navigation"

export function useSidebarNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAdmin, user } = useUser()
  const { pendingNavigationPath, beginNavigation, cancelNavigation } = useLayout()
  const settledView = pathname || "/"
  const currentView = pendingNavigationPath || settledView

  const navItems = useMemo(() => {
    return NAVIGATION_CONFIG.filter((item) => {
      if (item.isAdminOnly && !isAdmin) return false
      if (item.requiresAuth && !user) return false
      return true
    })
  }, [isAdmin, user])

  const handleNavigate = (href: string, isMobile: boolean, onClose?: () => void) => {
    if (href !== settledView || href === "/") {
      beginNavigation(href)
      try {
        router.push(href)
      } catch (error) {
        cancelNavigation()
        console.error("Navigation failed:", error)
      }
    } else {
      cancelNavigation()
    }
    if (isMobile) onClose?.()
  }

  return {
    navItems,
    currentView,
    pendingNavigationPath,
    handleNavigate,
  }
}
