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

type RequestOptions = {
  retry?: boolean
  refreshOnUnauthorized?: boolean
  refreshExpiredSession?: boolean
}

function getApiUrl() {
  return (process.env.JUSTMEMO_API_URL || DEFAULT_API_URL).replace(/\/$/, "")
}

function isAccessTokenExpired(accessToken: string) {
  const payload = accessToken.split(".")[1]
  if (!payload) return false

  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown
    }
    return typeof exp === "number" && exp * 1000 <= Date.now()
  } catch {
    return false
  }
}

async function refreshSession(session: CliSession) {
  const refreshed = await request<CliSession>(
    "/api/cli/v1/auth/refresh",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    },
    { retry: false }
  )
  if (!refreshed.data) throw new Error("登录已失效，请重新登录")

  await writeSession(refreshed.data)
  return refreshed.data
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  {
    retry = true,
    refreshOnUnauthorized = false,
    refreshExpiredSession = false,
  }: RequestOptions = {}
): Promise<CliResponse<T>> {
  let session = await readSession()
  if (session && refreshExpiredSession && isAccessTokenExpired(session.access_token)) {
    session = await refreshSession(session)
  }
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`)

  const response = await fetch(`${getApiUrl()}${path}`, { ...init, headers })

  if (response.status === 401 && retry && refreshOnUnauthorized && session?.refresh_token) {
    try {
      await refreshSession(session)
      return request<T>(path, init, { retry: false, refreshOnUnauthorized, refreshExpiredSession })
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
  params.set("page", String(options.page))

  return request<MemoSummary[]>(
    `/api/cli/v1/memos?${params.toString()}`,
    {},
    {
      refreshOnUnauthorized: true,
      refreshExpiredSession: true,
    }
  )
}

export function showMemo(memoNumber: string) {
  return request<MemoSummary>(
    `/api/cli/v1/memos/${encode(memoNumber)}`,
    {},
    {
      refreshOnUnauthorized: true,
      refreshExpiredSession: true,
    }
  )
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
  return request<CliUser>(
    "/api/cli/v1/auth/me",
    {},
    {
      refreshOnUnauthorized: true,
      refreshExpiredSession: true,
    }
  )
}

export function publishMemo(input: {
  content: string
  images: string[]
  is_private: boolean
  access_code?: string
  access_code_hint?: string
  is_pinned: boolean
}) {
  return request<MemoSummary>(
    "/api/cli/v1/memos/publish",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    { refreshOnUnauthorized: true, refreshExpiredSession: true }
  )
}
