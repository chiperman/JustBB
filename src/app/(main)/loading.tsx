import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"

export default function MainRouteLoading() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
        <HugeiconsIcon icon={Loading03Icon} size={18} className="animate-spin" />
        <span className="font-mono uppercase tracking-[0.2em]">Loading</span>
      </div>
    </div>
  )
}
