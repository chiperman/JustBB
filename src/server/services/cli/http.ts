import { NextResponse } from "next/server"

/**
 * CLI v1 API 的统一 seam adapter：响应封装、错误码和参数校验的唯一出口。
 *
 * 错误文案是对人的消息，必须保持稳定——野外旧版本 CLI 按文案匹配错误，
 * 一个字都不能改。机器可读的判定一律走 code。
 */
export const CLI_ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  ADMIN_ONLY: "ADMIN_ONLY",
  FORBIDDEN: "FORBIDDEN",
  INVALID_JSON: "INVALID_JSON",
  INVALID_PARAMS: "INVALID_PARAMS",
  INVALID_MEMO_NUMBER: "INVALID_MEMO_NUMBER",
  MEMO_NOT_FOUND: "MEMO_NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NOT_FOUND: "NOT_FOUND",
  EXPIRED: "EXPIRED",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL",
} as const

export type CliErrorCode = (typeof CLI_ERROR_CODES)[keyof typeof CLI_ERROR_CODES]

export function cliOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, error: null }, { status })
}

export function cliError(error: string, status: number, code: CliErrorCode) {
  return NextResponse.json({ success: false, data: null, error, code }, { status })
}

export const CLI_DEFAULT_LIMIT = 20
export const CLI_MAX_LIMIT = 100
export const CLI_DEFAULT_PAGE = 1
export const CLI_MAX_PAGE = 10000

/** 返回 null 表示非法；调用方负责返回 400。 */
export function parseCliLimit(value: string | null) {
  if (value === null || value === "") return CLI_DEFAULT_LIMIT
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > CLI_MAX_LIMIT) return null
  return parsed
}

/** 返回 null 表示非法；调用方负责返回 400。 */
export function parseCliPage(value: string | null) {
  if (value === null || value === "") return CLI_DEFAULT_PAGE
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > CLI_MAX_PAGE) return null
  return parsed
}

export function isValidMemoNumber(value: string) {
  return /^\d+$/.test(value) && Number(value) >= 1
}
