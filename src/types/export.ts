/**
 * 海报主题配置接口
 */
export interface PosterTheme {
  id: string
  name: string
  styles: {
    container: {
      backgroundColor: string
      backgroundImage?: string
      color: string
      padding: string
      borderRadius: string
      boxShadow?: string
      borderColor?: string
    }
    header: {
      brandColor: string
      dateColor: string
      fontSize: string
      letterSpacing: string
      borderBottom?: string
    }
    content: {
      fontSize: string
      lineHeight: string
      fontFamily: "serif" | "sans" | "mono"
      color: string
    }
    footer: {
      textColor: string
      borderTop?: string
      qrBgColor: string
      qrFgColor: string
    }
    decorations?: {
      cornerColor?: string
      pattern?: "dots" | "grid" | "none"
      paperEffect?: "typewriter" | "noise" | "none"
      showMarginLine?: boolean
    }
  }
}
