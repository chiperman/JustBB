// Cali 的实测位置：距视觉视口底部 8px，额外叠加设备安全区。
export const MOBILE_TAB_BAR_POSITION_CLASS = "bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))]"

// Tab Bar 宽度为 `min(80vw, 390px)`，该值是它到视口右缘的距离。
export const MOBILE_TAB_BAR_SIDE_GUTTER_CLASS = "right-[max(10vw,calc((100vw-390px)/2))]"

// 8px 底部间距 + 56px Tab Bar + 12px 控件间距。
export const MOBILE_SCROLL_TOP_POSITION_CLASS =
  "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-[max(10vw,calc((100vw-390px)/2))] md:bottom-6 md:right-6"

export const MOBILE_CONTENT_BOTTOM_PADDING_CLASS =
  "pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-20"
