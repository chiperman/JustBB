"use client"

import { cn } from "@/shared/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip"
import { SearchInput } from "./SearchInput"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSelection } from "@/state/UIContext"
import { useUser } from "@/state/UserContext"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkSquare02Icon,
  ArrowDown01Icon,
  Sorting05Icon,
  Home01Icon,
  Loading03Icon as Loader2,
} from "@hugeicons/core-free-icons"
import { useHasMounted } from "@/shared/hooks/useHasMounted"

interface FeedHeaderProps {
  isRefreshing?: boolean
}

export function FeedHeader({ isRefreshing = false }: FeedHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get("sort") || "newest"
  const activeDate = searchParams.get("date")

  const { isSelectionMode, toggleSelectionMode, selectedIds } = useSelection()
  const { user } = useUser()
  const hasMounted = useHasMounted()

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    params.set("sort", value)
    router.push(`?${params.toString()}`)
  }

  const hasContext = !!(
    activeDate ||
    searchParams?.get("tag") ||
    searchParams?.get("num") ||
    (searchParams?.get("year") && searchParams?.get("month"))
  )

  return (
    <div
      className={cn(
        "flex h-10 items-center justify-between gap-4 pl-14 transition-all duration-300 lg:pl-0",
        hasContext && "mb-9"
      )}
    >
      {isSelectionMode ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary">{selectedIds.size} SELECTED</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="flex items-center whitespace-nowrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  onClick={() => {
                    router.push("/")
                  }}
                  className="group mr-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-all hover:bg-secondary active:scale-95 outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
                  aria-label="回到首页"
                >
                  {isRefreshing ? (
                    <HugeiconsIcon icon={Loader2} size={14} className="text-primary animate-spin" />
                  ) : (
                    <HugeiconsIcon
                      icon={Home01Icon}
                      size={14}
                      className="text-primary/70 group-hover:text-primary transition-colors"
                    />
                  )}
                  <span className="font-bold tracking-tight text-primary group-hover:text-primary transition-colors">
                    JustMemo
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">回到首页</TooltipContent>
            </Tooltip>
          </div>

          {hasMounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:bg-secondary rounded-md transition-all active:scale-95 focus-visible:ring-inset"
                  aria-label="更多选项"
                >
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={14}
                    className="transition-transform group-data-[state=open]:rotate-180"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" className="w-48">
                {user && (
                  <>
                    <DropdownMenuItem className="gap-2" onClick={() => toggleSelectionMode(true)}>
                      <HugeiconsIcon icon={CheckmarkSquare02Icon} size={16} />
                      <span>选择笔记</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <HugeiconsIcon icon={Sorting05Icon} size={16} />
                    <span>排序方式</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={currentSort} onValueChange={handleSortChange}>
                        <DropdownMenuRadioItem value="newest">
                          创建时间，从新到旧
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="oldest">
                          创建时间，从旧到新
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:bg-accent rounded-md transition-all active:scale-95 focus-visible:ring-inset invisible"
              aria-label="更多选项"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
            </Button>
          )}
        </div>
      )}

      {!isSelectionMode && (
        <div className="flex-1 max-w-sm">
          <SearchInput />
        </div>
      )}
    </div>
  )
}
