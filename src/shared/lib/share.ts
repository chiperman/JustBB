const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl)
  }

  if (typeof window !== "undefined") {
    return trimTrailingSlash(window.location.origin)
  }

  return ""
}

export function getMemoShareUrl(memoId: string) {
  const baseUrl = getPublicAppUrl()
  return baseUrl ? `${baseUrl}/share/${memoId}` : `/share/${memoId}`
}
