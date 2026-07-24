import { describe, expect, it } from "vitest"

import {
  MOBILE_CONTENT_BOTTOM_PADDING_CLASS,
  MOBILE_SCROLL_TOP_POSITION_CLASS,
  MOBILE_TAB_BAR_SIDE_GUTTER_CLASS,
  MOBILE_TAB_BAR_POSITION_CLASS,
} from "./mobile-floating-layout"

describe("mobile floating layout", () => {
  it("使用 Cali 的 8px 底部定位", () => {
    expect(MOBILE_TAB_BAR_POSITION_CLASS).toBe(
      "bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"
    )
  })

  it("把回到顶部按钮放在 Tab Bar 上方并沿其右边缘对齐", () => {
    expect(MOBILE_SCROLL_TOP_POSITION_CLASS).toBe(
      "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-[max(10vw,calc((100vw-390px)/2))] md:bottom-6 md:right-6"
    )
    expect(MOBILE_TAB_BAR_SIDE_GUTTER_CLASS).toBe("right-[max(10vw,calc((100vw-390px)/2))]")
  })

  it("为移动端列表末项预留 Tab Bar、间距和底部安全区", () => {
    expect(MOBILE_CONTENT_BOTTOM_PADDING_CLASS).toBe(
      "pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-20"
    )
  })
})
