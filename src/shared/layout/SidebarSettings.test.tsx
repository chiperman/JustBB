import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: vi.fn(),
  }),
}))

vi.mock("@/state/UserContext", () => ({
  useUser: () => ({
    user: null,
    setUser: vi.fn(),
  }),
}))

vi.mock("@/state/LayoutContext", () => ({
  useLayout: () => ({
    setViewMode: vi.fn(),
  }),
}))

vi.mock("@/features/auth/actions", () => ({
  logout: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}))

vi.mock("./ExportConfigDialog", () => ({
  ExportConfigDialog: () => null,
}))

vi.mock("./ImportConfigDialog", () => ({
  ImportConfigDialog: () => null,
}))

vi.mock("@/features/admin/components/UsageModal", () => ({
  UsageModal: () => null,
}))

import { SidebarSettings } from "./SidebarSettings"

describe("SidebarSettings", () => {
  it("keeps a visible focus ring on the trigger button", () => {
    const html = renderToStaticMarkup(<SidebarSettings />)

    expect(html).not.toContain("focus-visible:ring-0")
    expect(html).toContain("focus-visible:ring-1")
    expect(html).toContain("focus-visible:ring-ring")
  })
})
