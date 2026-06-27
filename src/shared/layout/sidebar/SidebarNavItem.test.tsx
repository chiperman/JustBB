import { Home01Icon } from "@hugeicons/core-free-icons"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SidebarNavItem } from "./SidebarNavItem"
import type { NavigationItem } from "@/config/navigation"

describe("SidebarNavItem", () => {
  it("uses bounded hover interaction classes", () => {
    const item: NavigationItem = {
      id: "home",
      href: "/",
      label: "首页",
      icon: Home01Icon as NavigationItem["icon"],
    }

    const html = renderToStaticMarkup(
      <SidebarNavItem item={item} isActive={false} isCollapsed={false} onClick={() => undefined} />
    )

    expect(html).toContain("transition-[background-color,color,box-shadow]")
    expect(html).toContain("hover:shadow-[inset_0_0_0_1px_hsl(var(--border)/0.4)]")
    expect(html).toContain("[@media(pointer:coarse)]:active:scale-95")
  })
})
