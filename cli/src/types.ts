export type CliResponse<T> = {
  success: boolean
  data: T | null
  error: string | null
}

export type CliSession = {
  access_token: string
  refresh_token: string
  expires_at?: number | null
}

export type DeviceAuthStart = {
  request_id: string
  code: string
  expires_at: string
  authorize_url: string
}

export type DeviceAuthPoll =
  | { status: "pending"; expires_at: string }
  | { status: "approved"; access_token: string; refresh_token: string }

export type CliUser = {
  id: string
  email?: string
  role: string
}

export type MemoSummary = {
  id: string
  memo_number: number
  content: string
  tags?: string[] | null
  created_at: string
  is_private?: boolean
  is_locked?: boolean
  access_code_hint?: string | null
  images?: string[] | null
}

export type SearchOptions = {
  query: string
  tag?: string
  num?: string
  limit: number
  json: boolean
}

export type PublishOptions = {
  content: string
  isPrivate: boolean
  isPinned: boolean
  json: boolean
}

export type ShowOptions = {
  memoNumber: string
  json: boolean
  unlock: boolean
}
