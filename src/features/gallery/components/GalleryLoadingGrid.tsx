import { Skeleton } from "@/shared/ui/skeleton"
import { cn } from "@/shared/lib/utils"

export function GalleryLoadingGrid({ visible = true }: { visible?: boolean }) {
  return (
    <div
      className={cn(
        "grid min-h-[280px] grid-cols-1 gap-8 transition-opacity duration-200 motion-reduce:transition-none sm:grid-cols-2 lg:grid-cols-3",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      role={visible ? "status" : undefined}
      aria-label={visible ? "正在加载画廊" : undefined}
      aria-hidden={visible ? undefined : true}
      data-gallery-loading-skeleton={visible ? "visible" : "hidden"}
    >
      {[1, 2, 3].map((item) => (
        <Skeleton
          key={item}
          className="aspect-[1.18/1] rounded-xl bg-muted/30 opacity-75 motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}
