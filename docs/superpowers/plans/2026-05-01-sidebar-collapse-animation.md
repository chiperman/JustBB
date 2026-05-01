# 侧边栏收缩按钮动画优化实施计划

> **执行者必读：** 必须使用 `subagent-driven-development` (推荐) 或 `executing-plans` 技能逐项任务执行。步骤使用复选框 (`- [ ]`) 语法进行跟踪。

**目标：** 提取通用的侧边栏收缩按钮组件，并实现“极简呼吸感”的比例同步淡入淡出动画。

**架构：** 采用原子化组件设计，将按钮交互逻辑与容器布局解耦。利用 `framer-motion` 的 `AnimatePresence` 实现平滑的图标更替。

**技术栈：** React, TypeScript, Framer Motion, Hugeicons, Tailwind CSS

---

### 任务 1: 创建通用 `SidebarCollapseButton` 组件

**文件：**

- 创建：`src/shared/layout/SidebarCollapseButton.tsx`

- [ ] **步骤 1: 编写组件代码**

```tsx
"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

interface SidebarCollapseButtonProps {
  isCollapsed: boolean
  onClick: () => void
  side: "left" | "right"
  isMobile?: boolean
  label?: string
  className?: string
}

export function SidebarCollapseButton({
  isCollapsed,
  onClick,
  side,
  isMobile = false,
  label,
  className,
}: SidebarCollapseButtonProps) {
  const getIcon = () => {
    if (isMobile && side === "left") return Cancel01Icon
    if (side === "left") {
      return isCollapsed ? PanelLeftCloseIcon : PanelLeftOpenIcon
    }
    return isCollapsed ? PanelRightOpenIcon : PanelRightCloseIcon
  }

  const Icon = getIcon()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "h-9 w-9 shrink-0 rounded-md px-0 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground hover:ring-1 hover:ring-border/40",
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={isCollapsed ? "collapsed" : "expanded"}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1],
          }}
          className="flex items-center justify-center"
        >
          <HugeiconsIcon icon={Icon} size={16} />
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
```

- [ ] **步骤 2: 提交代码**

```bash
git add src/shared/layout/SidebarCollapseButton.tsx
git commit -m "feat(ui): 增加通用 SidebarCollapseButton 组件并应用优化动画"
```

---

### 任务 2: 在 `LeftSidebar` 中应用新组件

**文件：**

- 修改：`src/shared/layout/LeftSidebar.tsx`

- [ ] **步骤 1: 修改 `LeftSidebar` 导入与调用**

```tsx
// 替换导入
import { SidebarCollapseButton } from "./SidebarCollapseButton"

// 替换原有 Button (约 119-140 行)
;<SidebarCollapseButton
  isCollapsed={effectiveIsCollapsed}
  onClick={toggleCollapsedState}
  side="left"
  isMobile={isMobile}
  label={
    isMobile ? "关闭侧边栏" : effectiveIsCollapsed ? "展开侧边栏" : "收起侧边栏"
  }
/>
```

- [ ] **步骤 2: 提交代码**

```bash
git add src/shared/layout/LeftSidebar.tsx
git commit -m "refactor(layout): 在左侧边栏使用通用的收缩按钮组件"
```

---

### 任务 3: 在 `RightSidebar` 中应用新组件

**文件：**

- 修改：`src/shared/layout/RightSidebar.tsx`

- [ ] **步骤 1: 修改 `RightSidebar` 导入与调用**

```tsx
// 替换导入
import { SidebarCollapseButton } from "./SidebarCollapseButton"

// 1. 替换收缩状态下的按钮 (约 291-301 行)
{
  isCollapsed && (
    <div className="absolute top-6 right-6 z-30">
      <SidebarCollapseButton
        isCollapsed={true}
        onClick={() => setCollapsedState(false)}
        side="right"
        label="展开右侧时间轴"
        className="bg-background border border-border"
      />
    </div>
  )
}

// 2. 替换展开状态下的按钮 (约 314-324 行)
;<SidebarCollapseButton
  isCollapsed={false}
  onClick={() => setCollapsedState(true)}
  side="right"
  label="收起右侧时间轴"
/>
```

- [ ] **步骤 2: 提交代码**

```bash
git add src/shared/layout/RightSidebar.tsx
git commit -m "refactor(layout): 在右侧边栏使用通用的收缩按钮组件"
```

---

### 任务 4: 最终验证与清理

- [ ] **步骤 1: 检查动画效果**
- 运行：`npm run dev` 并手动操作侧边栏。
- 确认：图标切换时是否有平滑的缩放和淡入淡出，且无图标重叠。
- [ ] **步骤 2: 检查控制台报错**
- 确认：无 React key 缺失或其他动画警告。
- [ ] **步骤 3: 最终提交**

```bash
git commit --allow-empty -m "chore(animation): 完成侧边栏按钮动画优化验证"
```
