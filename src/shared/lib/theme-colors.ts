export const APP_THEME_COLORS = {
  light: "#f8f8f8",
  dark: "#131211",
} as const

export function resolveAppThemeColor(resolvedTheme: string | undefined) {
  return resolvedTheme === "dark" ? APP_THEME_COLORS.dark : APP_THEME_COLORS.light
}
