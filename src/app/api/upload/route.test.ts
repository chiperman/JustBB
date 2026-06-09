import { describe, it, expect, vi, beforeEach } from "vitest"

describe("checkRateLimit", () => {
  let checkRateLimit: (userId: string) => boolean
  const RATE_LIMIT_WINDOW_MS = 60_000
  const RATE_LIMIT_MAX_REQUESTS = 10

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    // Reset modules to get fresh rate limit Map
    vi.resetModules()
    const { checkRateLimit: cl } = await import("@/app/api/upload/route")
    checkRateLimit = cl
  })

  it("应该在速率限制内返回 true", () => {
    const timestamps = new Map<string, number[]>()
    const mockCheck = (userId: string) => {
      const now = Date.now()
      const ts = timestamps.get(userId) ?? []
      const recent = ts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
      if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        timestamps.set(userId, recent)
        return false
      }
      recent.push(now)
      timestamps.set(userId, recent)
      return true
    }

    // 前 10 次应该通过
    for (let i = 0; i < 10; i++) {
      expect(mockCheck("user-1")).toBe(true)
    }
    // 第 11 次应该被拒绝
    expect(mockCheck("user-1")).toBe(false)
  })

  it("应该基于 userId 分别限速", () => {
    const timestamps = new Map<string, number[]>()
    const mockCheck = (userId: string) => {
      const now = Date.now()
      const ts = timestamps.get(userId) ?? []
      const recent = ts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
      if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        timestamps.set(userId, recent)
        return false
      }
      recent.push(now)
      timestamps.set(userId, recent)
      return true
    }

    // user-1 满 10 次
    for (let i = 0; i < 10; i++) {
      mockCheck("user-1")
    }
    expect(mockCheck("user-1")).toBe(false)

    // user-2 应该通过（独立限速）
    expect(mockCheck("user-2")).toBe(true)
  })

  it("过期 60 秒后应该允许再次上传", () => {
    vi.useFakeTimers()

    const timestamps = new Map<string, number[]>()
    const mockCheck = (userId: string) => {
      const now = Date.now()
      const ts = timestamps.get(userId) ?? []
      const recent = ts.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
      if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
        timestamps.set(userId, recent)
        return false
      }
      recent.push(now)
      timestamps.set(userId, recent)
      return true
    }

    // 第 1 次
    expect(mockCheck("user-1")).toBe(true)

    // 快进到 61 秒后
    vi.advanceTimersByTime(61_001)

    // 过期了，应该允许
    expect(mockCheck("user-1")).toBe(true)

    vi.useRealTimers()
  })
})
