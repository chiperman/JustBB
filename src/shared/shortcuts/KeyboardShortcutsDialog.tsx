"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { ShortcutHint } from "@/shared/shortcuts/ShortcutHint"

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SHORTCUT_GROUPS = [
  {
    title: "通用",
    items: [
      { shortcut: "mod+/", displayShortcut: "mod+?", label: "查看快捷键" },
      { shortcut: "mod+k", label: "聚焦搜索" },
      { shortcut: "mod+enter", label: "新建 Memo" },
      { shortcut: "mod+arrowup", label: "回到顶部" },
    ],
  },
  {
    title: "选择",
    items: [{ shortcut: "mod+shift+x", label: "切换选择模式" }],
  },
]

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-6 border-border/80 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-normal">快捷键</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            按住 Command 或 Ctrl，再按对应按键。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} className="space-y-2.5">
              <h3 className="px-1 text-xs font-semibold text-muted-foreground/75">{group.title}</h3>
              <div className="overflow-hidden rounded-lg border border-border/80 bg-secondary/30">
                {group.items.map((item) => (
                  <div
                    key={`${group.title}-${item.shortcut}`}
                    className="flex min-h-[52px] items-center justify-between gap-4 border-b border-border/70 px-4 py-2.5 last:border-b-0 hover:bg-background/70"
                  >
                    <span className="text-[15px] font-medium text-foreground/80">{item.label}</span>
                    <ShortcutHint
                      shortcut={item.shortcut}
                      displayShortcut={"displayShortcut" in item ? item.displayShortcut : undefined}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
