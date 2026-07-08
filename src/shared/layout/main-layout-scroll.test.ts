import { describe, expect, it } from "vitest"

import { resolveMainLayoutScrollState } from "./main-layout-scroll"

describe("resolveMainLayoutScrollState", () => {
  it("内容高度临界时，继续向下滚不会解除已折叠的首页搜索栏布局", () => {
    expect(
      resolveMainLayoutScrollState({
        currentCollapsed: true,
        scrollTop: 140,
        scrollableHeight: 280,
        isMobile: false,
      }).editorForceCollapsed
    ).toBe(true)
  })

  it("内容高度临界时，回到顶部附近仍会展开首页搜索栏布局", () => {
    expect(
      resolveMainLayoutScrollState({
        currentCollapsed: true,
        scrollTop: 20,
        scrollableHeight: 280,
        isMobile: false,
      }).editorForceCollapsed
    ).toBe(false)
  })

  it("移动端不强制折叠首页搜索栏布局", () => {
    expect(
      resolveMainLayoutScrollState({
        currentCollapsed: true,
        scrollTop: 500,
        scrollableHeight: 1000,
        isMobile: true,
      })
    ).toEqual({
      editorForceCollapsed: false,
      showScrollTop: true,
    })
  })
})
