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
        backgroundColor: "#1c1917", // 从 #0c0a09 改为更柔和的 Stone-900
        color: "#e7e5e4", // 柔白文字
        padding: "40px",
        borderRadius: "24px",
        borderColor: "#292524",
      },
      header: {
        brandColor: "#b45309", // 从 #f59e0b 改为低饱和度的琥珀棕/金
        dateColor: "#57534e",
        fontSize: "13px",
        letterSpacing: "0.15em",
        borderBottom: "1px solid #292524",
      },
      content: {
        fontSize: "16px",
        lineHeight: "1.8",
        fontFamily: "serif",
        color: "#d6d3d1", // 再次降低文字亮度
      },
      footer: {
        textColor: "#57534e",
        borderTop: "1px solid #292524",
        qrBgColor: "#292524",
        qrFgColor: "#b45309", // 二维码同样使用低饱和度色
      },
      decorations: {
        paperEffect: "noise",
        cornerColor: "rgba(180, 83, 9, 0.08)",
      },
    },
  },
}
