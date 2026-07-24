// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("./MobileNavbar", () => ({
  MobileNavbar: () => <div data-testid="mobile-navbar" />,
}))

import { MobileLayoutWrapper } from "./MobileLayoutWrapper"

describe("MobileLayoutWrapper", () => {
  it("将移动端导航挂到文档根节点，避免继承应用壳的动画变换", async () => {
    const { container } = render(
      <MobileLayoutWrapper>
        <main>页面内容</main>
      </MobileLayoutWrapper>
    )

    await waitFor(() => expect(screen.getByTestId("mobile-navbar")).not.toBeNull())

    expect(container.querySelector('[data-testid="mobile-navbar"]')).toBeNull()
    expect(document.body.querySelector('[data-testid="mobile-navbar"]')).not.toBeNull()
  })
})
