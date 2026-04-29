"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings02Icon as Settings,
  UserIcon as User,
  Sun01Icon as Sun,
  Moon01Icon as Moon,
  ComputerIcon as Monitor,
  Logout02Icon as LogOut,
  Login03Icon as LogIn,
  Download02Icon as Download,
  Upload02Icon as Upload,
  Loading01Icon as Loader2,
  ShieldCheck,
  UserCircleIcon as UserCircle,
  FlashIcon,
} from "@hugeicons/core-free-icons"
import { useTheme } from "next-themes"
import { logout } from "@/features/auth/actions"
import { supabase } from "@/lib/supabase"
import {
  DRAFT_CONTENT_KEY,
  DRAFT_IS_PRIVATE_KEY,
} from "@/features/memos/hooks/useMemoEditor"
import { cn } from "@/lib/utils"
import { useLayout } from "@/context/LayoutContext"
import { useUser } from "@/context/UserContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UsageModal } from "@/components/admin/UsageModal"
import { ExportConfigDialog } from "./ExportConfigDialog"
import { ImportConfigDialog } from "./ImportConfigDialog"

interface SidebarSettingsProps {
  isCollapsed?: boolean
}

export function SidebarSettings({ isCollapsed = false }: SidebarSettingsProps) {
  const { user, setUser } = useUser()
  const { setViewMode } = useLayout()
  const { theme, setTheme } = useTheme()
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false)
  const [importDialogOpen, setImportDialogOpen] = React.useState(false)
  const [usageModalOpen, setUsageModalOpen] = React.useState(false)

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    setUser(null)
    await supabase.auth.signOut()
    await logout()
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_CONTENT_KEY)
      localStorage.removeItem(DRAFT_IS_PRIVATE_KEY)
    }
    setLoggingOut(false)
  }

  const renderIdentity = () => {
    if (user?.role === "admin")
      return (
        <HugeiconsIcon icon={ShieldCheck} size={16} className="text-primary" />
      )
    if (user)
      return (
        <HugeiconsIcon
          icon={User}
          size={16}
          className="text-muted-foreground"
        />
      )
    return (
      <HugeiconsIcon
        icon={UserCircle}
        size={16}
        className="text-muted-foreground"
      />
    )
  }

  const identityLabel = user ? user.email : "未登录"
  const triggerClassName = cn(
    "h-9 rounded-md bg-transparent hover:bg-secondary hover:text-accent-foreground hover:ring-1 hover:ring-border/40 focus-visible:ring-0 focus-visible:outline-none transition-all duration-200",
    isCollapsed
      ? "w-9 justify-center px-0"
      : "flex w-full items-center justify-start gap-3 px-3"
  )

  if (!hasMounted) {
    return (
      <Button
        variant="ghost"
        className={triggerClassName}
        aria-label="账号与设置"
      >
        <HugeiconsIcon
          icon={Settings}
          size={16}
          className="text-muted-foreground"
        />
        {!isCollapsed && (
          <span className="nav-button-text truncate opacity-80">
            {identityLabel}
          </span>
        )}
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={triggerClassName}
            aria-label="账号与设置"
          >
            <div className="relative shrink-0">
              <HugeiconsIcon
                icon={Settings}
                size={16}
                className="text-muted-foreground"
              />
              {user && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-background bg-primary" />
              )}
            </div>
            {!isCollapsed && (
              <span className="nav-button-text truncate opacity-80">
                {identityLabel}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-64">
          <DropdownMenuLabel className="font-normal px-3 py-3">
            <div className="flex flex-col space-y-2">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] opacity-50">
                Identity / 身份
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-xl border border-border/40",
                    user ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  {renderIdentity()}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="body-large font-bold truncate leading-none">
                    {user
                      ? user.role === "admin"
                        ? "正式管理员"
                        : "普通用户"
                      : "匿名身份"}
                  </p>
                  <p className="micro-label truncate mt-1.5 opacity-70">
                    {user ? user.email : "仅可查看公开内容"}
                  </p>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="px-1 py-1">
            <DropdownMenuLabel className="px-2 py-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] opacity-50">
              Settings / 偏好
            </DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="h-10">
                <HugeiconsIcon
                  icon={Sun}
                  size={16}
                  className="mr-2 text-primary"
                />
                <span className="nav-button-text">外观主题</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="ml-1">
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={setTheme}
                  >
                    <DropdownMenuRadioItem value="light" className="h-9">
                      <HugeiconsIcon
                        icon={Sun}
                        size={15}
                        className="mr-2 text-primary opacity-80"
                      />
                      <span className="nav-button-text">浅色模式</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark" className="h-9">
                      <HugeiconsIcon
                        icon={Moon}
                        size={15}
                        className="mr-2 text-primary opacity-80"
                      />
                      <span className="nav-button-text">深色模式</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system" className="h-9">
                      <HugeiconsIcon
                        icon={Monitor}
                        size={15}
                        className="mr-2 text-primary opacity-80"
                      />
                      <span className="nav-button-text">跟随系统</span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </div>

          <DropdownMenuSeparator />

          <div className="px-1 py-1">
            <p className="px-2 py-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] opacity-50">
              Tools / 工具
            </p>
            <DropdownMenuItem
              className="h-10 disabled:opacity-40"
              onClick={() => setImportDialogOpen(true)}
              disabled={!user}
            >
              <HugeiconsIcon
                icon={Upload}
                size={16}
                className="mr-2 text-primary"
              />
              <span className="nav-button-text">导入 Memos</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="h-10 disabled:opacity-40"
              onClick={() => setExportDialogOpen(true)}
              disabled={!user}
            >
              <HugeiconsIcon
                icon={Download}
                size={16}
                className="mr-2 text-primary"
              />
              <span className="nav-button-text">导出 Memos</span>
            </DropdownMenuItem>

            {user?.role === "admin" && (
              <DropdownMenuItem
                className="h-10 group"
                onClick={() => setUsageModalOpen(true)}
              >
                <HugeiconsIcon
                  icon={FlashIcon}
                  size={16}
                  className="mr-2 text-primary group-hover:animate-pulse"
                />
                <span className="nav-button-text">服务用量监控</span>
              </DropdownMenuItem>
            )}
          </div>

          <DropdownMenuSeparator />

          <div className="px-1 py-1">
            {!user ? (
              <DropdownMenuItem
                className="h-10"
                onClick={() => setViewMode("CARD_VIEW")}
              >
                <HugeiconsIcon
                  icon={LogIn}
                  size={16}
                  className="mr-2 text-primary"
                />
                <span className="nav-button-text">登录系统</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="h-10 text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <HugeiconsIcon
                  icon={loggingOut ? Loader2 : LogOut}
                  size={16}
                  className={cn("mr-2", loggingOut && "animate-spin")}
                />
                <span className="nav-button-text">退出登录</span>
              </DropdownMenuItem>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <UsageModal open={usageModalOpen} onOpenChange={setUsageModalOpen} />
      <ExportConfigDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
      <ImportConfigDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </>
  )
}
