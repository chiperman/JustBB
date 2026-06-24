import { PosterTheme } from "@/types/export"

export const POSTER_THEMES: Record<string, PosterTheme> = {
  classic: {
    id: "classic",
    name: "旧时光",
    styles: {
      container: {
        backgroundColor: "#f9f6f1",
        color: "#37302a",
        padding: "48px 40px",
        borderRadius: "0px",
        borderColor: "#e5e1da",
      },
      header: {
        brandColor: "#57534e",
        dateColor: "#a8a29e",
        fontSize: "12px",
        letterSpacing: "0.25em",
        borderBottom: "1px solid #e5e1da",
      },
      content: {
        fontSize: "15px",
        lineHeight: "1.9",
        fontFamily: "mono",
        color: "#44403c",
      },
      footer: {
        textColor: "#a8a29e",
        borderTop: "1px dashed #e5e1da",
        qrBgColor: "#ffffff",
        qrFgColor: "#44403c",
      },
      decorations: {
        paperEffect: "typewriter",
        showMarginLine: true,
        cornerColor: "rgba(217, 119, 6, 0.05)",
      },
    },
  },
  zen: {
    id: "zen",
    name: "极简禅意",
    styles: {
      container: {
        backgroundColor: "#fcfcfc",
        color: "#18181b",
        padding: "44px",
        borderRadius: "16px",
        borderColor: "#f4f4f5",
      },
      header: {
        brandColor: "#18181b",
        dateColor: "#a1a1aa",
        fontSize: "11px",
        letterSpacing: "0.1em",
      },
      content: {
        fontSize: "15px",
        lineHeight: "1.7",
        fontFamily: "sans",
        color: "#27272a",
      },
      footer: {
        textColor: "#d4d4d8",
        qrBgColor: "#f4f4f5",
        qrFgColor: "#18181b",
      },
      decorations: {
        paperEffect: "noise",
      },
    },
  },
  midnight: {
    id: "midnight",
    name: "暗夜时光",
    styles: {
      container: {
        backgroundColor: "#18181b", // 使用温和不刺眼的深灰底色 (Zinc-900)
        color: "#f4f4f5", // 标题保持柔白高亮 (Zinc-100)
        padding: "44px", // 完全对齐“极简禅意”的布局 padding
        borderRadius: "16px", // 完全对齐圆角
        borderColor: "#27272a", // 精致的深灰边框 (Zinc-800)
      },
      header: {
        brandColor: "#f4f4f5",
        dateColor: "#71717a", // 次要文字灰
        fontSize: "11px", // 完全对齐“极简禅意”的字号
        letterSpacing: "0.1em", // 完全对齐字间距
      },
      content: {
        fontSize: "15px", // 完全对齐“极简禅意”的字号
        lineHeight: "1.7", // 完全对齐行高
        fontFamily: "sans", // 对齐无衬线字体
        color: "#d4d4d8", // 柔和易读的灰白正文 (Zinc-300)
      },
      footer: {
        textColor: "#71717a",
        qrBgColor: "#0a0a0a", // 二维码使用稍深的深灰底座，营造内凹质感
        qrFgColor: "#d4d4d8", // 柔白色二维码
      },
      decorations: {
        paperEffect: "noise", // 保持和禅意一致的微噪点纸张效果，仅做纯颜色切换
      },
    },
  },
}
