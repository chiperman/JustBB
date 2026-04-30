import { Home01Icon } from "@hugeicons/core-free-icons"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { SidebarNavItem } from "./SidebarNavItem"
import type { NavigationItem } from "@/config/navigation"

describe("SidebarNavItem", () => {
  it("uses shared button scale interaction classes", () => {
    const item: NavigationItem = {
      id: "home",
      href: "/",
      label: "首页",
      icon: Home01Icon as NavigationItem["icon"],
    }

    const html = renderToStaticMarkup(
      <SidebarNavItem
        item={item}
        isActive={false}
        isCollapsed={false}
        onClick={() => undefined}
      />
    )

    expect(html).toContain("transition-all")
    expect(html).toContain("hover:scale-102")
    expect(html).toContain("active:scale-95")
  })
})
