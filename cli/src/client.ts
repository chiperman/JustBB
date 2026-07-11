import type {
  CliResponse,
  CliSession,
  CliUser,
  DeviceAuthPoll,
  DeviceAuthStart,
  MemoSummary,
  SearchOptions,
} from "./types.js"
import { readSession, writeSession } from "./auth-store.js"

export const DEFAULT_API_URL = "https://just-memo.vercel.app"

function getApiUrl() {
  return (process.env.JUSTMEMO_API_URL || DEFAULT_API_URL).replace(/\/$/, "")
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true
): Promise<CliResponse<T>> {
  const session = await readSession()
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`)

  const response = await fetch(`${getApiUrl()}${path}`, { ...init, headers })

  const shouldRefresh = path === "/api/cli/v1/auth/me"
  if (response.status === 401 && retry && shouldRefresh && session?.refresh_token) {
    try {
      const refreshed = await request<CliSession>(
        "/api/cli/v1/auth/refresh",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        },
        false
      )
      if (refreshed.data) {
        await writeSession(refreshed.data)
        return request<T>(path, init, false)
      }
    } catch {
      // 由下面的统一错误处理返回登录失效提示。
    }
  }

  const payload = (await response.json()) as CliResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.error || `请求失败：${response.status}`)
  }

  return payload
}

function encode(value: string) {
  return encodeURIComponent(value)
}

export function searchMemos(options: SearchOptions) {
  const params = new URLSearchParams()
  if (options.query) params.set("q", options.query)
  if (options.tag) params.set("tag", options.tag)
  if (options.num) params.set("num", options.num)
  params.set("limit", String(options.limit))

  return request<MemoSummary[]>(`/api/cli/v1/memos?${params.toString()}`)
}

export function showMemo(memoNumber: string) {
  return request<MemoSummary>(`/api/cli/v1/memos/${encode(memoNumber)}`)
}

export function unlockMemo(memoNumber: string, code: string) {
  return request<MemoSummary>(`/api/cli/v1/memos/${encode(memoNumber)}/unlock`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  })
}

export function startDeviceAuth() {
  return request<DeviceAuthStart>("/api/cli/v1/auth/device", { method: "POST" })
}

export function pollDeviceAuth(requestId: string, code: string) {
  return request<DeviceAuthPoll>("/api/cli/v1/auth/device/poll", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: requestId, code }),
  })
}

export function getCliCurrentUser() {
  return request<CliUser>("/api/cli/v1/auth/me")
}

export function publishMemo(input: {
  content: string
  images: string[]
  is_private: boolean
  access_code?: string
  access_code_hint?: string
  is_pinned: boolean
}) {
  return request<MemoSummary>("/api/cli/v1/memos/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}
