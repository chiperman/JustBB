import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "MobileNavbar.tsx")
const source = readFileSync(sourcePath, "utf8")

describe("MobileNavbar active indicator", () => {
  it("only translates the shared indicator on the x axis", () => {
    expect(source).toContain("animate={{ x: `${activeTabIndex * 100}%` }}")
    expect(source).toContain("w-[calc((100%-1.25rem)/5)]")
    expect(source).not.toContain('layoutId="mobileActiveTab"')
  })

  it("保留即时导航和可选预取，不额外延迟路由切换", () => {
    expect(source).toContain("prefetch={false}")
    expect(source).toContain("void prefetchPage(item.href)")
    expect(source).toContain("handleNavigate(item.href, true)")
    expect(source).not.toContain("setPendingTabId")
    expect(source).not.toContain("}, 220)")
  })

  it("打开更多面板时把共享指示器移动到更多按钮", () => {
    expect(source).toContain('if (isDrawerOpen) return "more"')
    expect(source).toContain('isDrawerOpen ? "text-primary font-medium"')
  })

  it("在减少动态效果时取消 Tab 选中指示器的 spring 动画", () => {
    expect(source).toContain("useReducedMotion")
    expect(source).toMatch(/transition=\{\s*shouldReduceMotion \? \{ duration: 0 \} :/)
  })
})
