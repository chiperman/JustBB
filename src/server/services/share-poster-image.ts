import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { Agent, fetch as undiciFetch } from "undici"

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])

type LookupResult = { address: string; family: number }
type LookupAddresses = (hostname: string) => Promise<LookupResult[]>

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number)
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true
  }

  const [first, second] = parts
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 198 && (second === 18 || second === 19 || second === 51)) ||
    (first === 203 && second === 0)
  )
}

function isPrivateIp(address: string) {
  const family = isIP(address)
  if (family === 4) return isPrivateIpv4(address)
  if (family !== 6) return true

  const normalized = address.toLowerCase()
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4)

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.")
  )
}

function resolvePublicAddresses(hostname: string): Promise<LookupResult[]> {
  return lookup(hostname, { all: true, verbatim: true })
}

/** 只允许解析到公网地址的 http(s) 图片来源。 */
export async function isSafePosterImageUrl(
  value: string,
  resolveAddresses: LookupAddresses = resolvePublicAddresses
) {
  return (await resolvePosterImageUrl(value, resolveAddresses)) !== null
}

async function resolvePosterImageUrl(
  value: string,
  resolveAddresses: LookupAddresses = resolvePublicAddresses
): Promise<{ url: URL; address: LookupResult } | null> {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
    return null
  }

  try {
    const addresses = await resolveAddresses(url.hostname)
    const address = addresses[0]
    if (!address || addresses.some(({ address: value }) => isPrivateIp(value))) return null
    return { url, address }
  } catch {
    return null
  }
}

interface ImageResponse {
  headers: { get(name: string): string | null }
  body: {
    getReader(): {
      read(): Promise<{ done: boolean; value?: Uint8Array }>
      cancel(): Promise<void>
    }
  } | null
}

async function readImageBody(response: ImageResponse) {
  const declaredSize = Number(response.headers.get("content-length"))
  if (Number.isFinite(declaredSize) && declaredSize > MAX_IMAGE_BYTES) return null
  if (!response.body) return null

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) return null
    size += value.byteLength
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }

  return Buffer.concat(chunks)
}

export async function fetchPosterImage(source: string) {
  let currentUrl = source

  for (let redirectCount = 0; redirectCount < 4; redirectCount += 1) {
    const resolved = await resolvePosterImageUrl(currentUrl)
    if (!resolved) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6_000)
    const dispatcher = new Agent({
      connect: {
        lookup: (_hostname, _options, callback) => {
          callback(null, resolved.address.address, resolved.address.family)
        },
      },
    })

    try {
      const response = await undiciFetch(resolved.url, {
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
        dispatcher,
        headers: { Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
      })

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        if (!location) return null
        currentUrl = new URL(location, currentUrl).toString()
        continue
      }

      const contentType = response.headers.get("content-type")?.split(";", 1)[0].toLowerCase()
      if (!response.ok || !contentType || !ALLOWED_CONTENT_TYPES.has(contentType)) return null

      const body = await readImageBody(response)
      return body ? { body, contentType } : null
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
      await dispatcher.close()
    }
  }

  return null
}
