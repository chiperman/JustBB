import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Image01Icon, Location04Icon, Tag01Icon } from "@hugeicons/core-free-icons"

import { ContextPageHeader, ContextPageShell } from "@/shared/layout/ContextPageShell"
import { MemoCardSkeleton } from "@/shared/ui/MemoCardSkeleton"
import { Skeleton } from "@/shared/ui/skeleton"
import { GalleryLoadingGrid } from "@/features/gallery/components/GalleryLoadingGrid"
import { GalleryEmptyState } from "@/features/gallery/components/GalleryEmptyState"
import { TagsEmptyState } from "@/features/tags/components/TagsEmptyState"
import { TrashEmptyState } from "@/features/trash/components/TrashEmptyState"
import { FeedHeader } from "@/shared/ui/FeedHeader"
import { cn } from "@/shared/lib/utils"

interface NavigationPageSkeletonProps {
  href: string
  showSkeleton?: boolean
  galleryIsKnownEmpty?: boolean
  tagsAreKnownEmpty?: boolean
  trashIsKnownEmpty?: boolean
}

function TagsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div key={item} className="space-y-3 rounded-xl border border-border/50 bg-card p-4">
          <Skeleton className="h-4 w-20 motion-reduce:animate-none" />
          <Skeleton className="h-2 w-full motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  )
}

function MemoListSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((item) => (
        <MemoCardSkeleton key={item} />
      ))}
    </div>
  )
}

export function NavigationPageSkeleton({
  href,
  showSkeleton = true,
  galleryIsKnownEmpty = false,
  tagsAreKnownEmpty = false,
  trashIsKnownEmpty = false,
}: NavigationPageSkeletonProps) {
  const pathname = href.split("?")[0] || "/"

  if (pathname === "/") {
    return (
      <div
        className="flex h-full flex-col overflow-hidden bg-background"
        role={showSkeleton ? "status" : undefined}
        aria-label={showSkeleton ? "正在加载首页" : undefined}
        data-navigation-skeleton={showSkeleton ? "home" : undefined}
      >
        <div className="flex-none border-b border-border/20 px-6 py-5">
          <div className="mx-auto max-w-screen-md">
            <FeedHeader showSelectionState={false} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-6 pt-4">
          <div
            className={cn(
              "mx-auto max-w-screen-md transition-opacity duration-200 motion-reduce:transition-none",
              showSkeleton ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            aria-hidden={showSkeleton ? undefined : true}
          >
            <MemoListSkeleton />
          </div>
        </div>
      </div>
    )
  }

  const page =
    pathname === "/gallery"
      ? {
          id: "gallery",
          title: "画廊",
          icon: Image01Icon,
          content: galleryIsKnownEmpty ? (
            <GalleryEmptyState />
          ) : (
            <GalleryLoadingGrid visible={showSkeleton} />
          ),
        }
      : pathname === "/tags"
        ? {
            id: "tags",
            title: "标签",
            icon: Tag01Icon,
            content: tagsAreKnownEmpty ? (
              <TagsEmptyState />
            ) : (
              <div
                className={cn(
                  "transition-opacity duration-200 motion-reduce:transition-none",
                  showSkeleton ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                aria-hidden={showSkeleton ? undefined : true}
              >
                <TagsSkeleton />
              </div>
            ),
          }
        : pathname === "/trash"
          ? {
              id: "trash",
              title: "回收站",
              icon: Delete02Icon,
              content: trashIsKnownEmpty ? (
                <TrashEmptyState />
              ) : (
                <div
                  className={cn(
                    "transition-opacity duration-200 motion-reduce:transition-none",
                    showSkeleton ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                  aria-hidden={showSkeleton ? undefined : true}
                >
                  <MemoListSkeleton />
                </div>
              ),
            }
          : {
              id: "map",
              title: "地图",
              icon: Location04Icon,
              content: (
                <div
                  className={cn(
                    "relative h-full min-h-[420px] overflow-hidden rounded-xl border border-border/60 bg-muted/20 transition-opacity duration-200 motion-reduce:transition-none",
                    showSkeleton ? "opacity-100" : "pointer-events-none opacity-0"
                  )}
                  aria-hidden={showSkeleton ? undefined : true}
                >
                  <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:40px_40px]" />
                  <div className="absolute inset-0 flex items-center justify-center text-primary/55">
                    <HugeiconsIcon
                      icon={Location04Icon}
                      size={34}
                      className="animate-pulse motion-reduce:animate-none"
                    />
                  </div>
                </div>
              ),
            }

  const useFullHeightLayout =
    pathname === "/map" ||
    (pathname === "/gallery" && galleryIsKnownEmpty) ||
    (pathname === "/tags" && tagsAreKnownEmpty) ||
    (pathname === "/trash" && trashIsKnownEmpty)
  const maxWidthClassName = useFullHeightLayout
    ? "max-w-screen-xl h-full flex flex-col min-h-0"
    : pathname === "/gallery"
      ? "max-w-screen-xl"
      : undefined

  return (
    <div
      className="h-full"
      role={showSkeleton ? "status" : undefined}
      aria-label={showSkeleton ? `正在加载${page.title}` : undefined}
      data-navigation-skeleton={showSkeleton ? page.id : undefined}
    >
      <ContextPageShell
        scrollable={!useFullHeightLayout}
        maxWidthClassName={maxWidthClassName}
        contentClassName={
          useFullHeightLayout ? "flex-1 h-full min-h-0 pt-4 pb-6 flex flex-col" : undefined
        }
        header={<ContextPageHeader icon={page.icon} title={page.title} />}
      >
        {page.content}
      </ContextPageShell>
    </div>
  )
}
