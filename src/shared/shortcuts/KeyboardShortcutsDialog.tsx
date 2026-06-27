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
      { shortcut: "mod+/", label: "查看快捷键" },
      { shortcut: "mod+k", label: "聚焦搜索" },
      { shortcut: "mod+enter", label: "新建 Memo" },
      { shortcut: "mod+arrowup", label: "回到顶部" },
    ],
  },
  {
    title: "选择",
    items: [
      { shortcut: "mod+x", label: "切换选择模式" },
      { shortcut: "mod+a", label: "全选当前列表" },
      { shortcut: "mod+d", label: "清空选择" },
    ],
  },
]

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-5">
        <DialogHeader>
          <DialogTitle>快捷键</DialogTitle>
          <DialogDescription>常用键盘操作。</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                {group.title}
              </h3>
              <div className="divide-y divide-border rounded-md border border-border">
                {group.items.map((item) => (
                  <div
                    key={`${group.title}-${item.shortcut}`}
                    className="flex items-center justify-between gap-4 px-3 py-2.5"
                  >
                    <span className="text-sm text-foreground/80">{item.label}</span>
                    <ShortcutHint shortcut={item.shortcut} />
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
