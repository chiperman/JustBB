import { env } from "@/lib/env"

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

/**
 * 获取当前的公共应用访问地址 (智能识别)
 * 逻辑已迁移至 src/lib/env.ts 以实现全栈统一
 */
export function getPublicAppUrl() {
  const configuredUrl = env.NEXT_PUBLIC_SITE_URL

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl)
  }

  // 客户端回退
  if (typeof window !== "undefined") {
    return trimTrailingSlash(window.location.origin)
  }

  return ""
}

export function getMemoShareUrl(memoId: string) {
  const baseUrl = getPublicAppUrl()
  return baseUrl ? `${baseUrl}/share/${memoId}` : `/share/${memoId}`
}
