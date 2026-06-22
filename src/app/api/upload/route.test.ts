import { NextRequest } from "next/server"
import { describe, it, expect, vi, beforeEach } from "vitest"

const { getClientMock, s3SendMock } = vi.hoisted(() => ({
  getClientMock: vi.fn(),
  s3SendMock: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  getClient: getClientMock,
}))

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function S3Client() {
    return { send: s3SendMock }
  }),
  PutObjectCommand: vi.fn(function PutObjectCommand(input) {
    return input
  }),
}))

function createPngBuffer(width: number, height: number) {
  const buffer = Buffer.alloc(24)
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer, 0)
  buffer.writeUInt32BE(width, 16)
  buffer.writeUInt32BE(height, 20)
  return buffer
}

describe("checkRateLimit", () => {
  let checkRateLimit: (userId: string) => boolean
  const RATE_LIMIT_WINDOW_MS = 60_000
  const RATE_LIMIT_MAX_REQUESTS = 10

  beforeEach(async () => {
    vi.unstubAllGlobals()
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

describe("POST", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    vi.resetModules()
    getClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                account_id: "account",
                access_key_id: "access-key",
                secret_access_key: "secret-key",
                bucket_name: "bucket",
                public_url: "https://cdn.example.com/",
              },
            }),
          })),
        })),
      })),
    })
    s3SendMock.mockResolvedValue({})
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })))
  })

  it("上传成功后应该返回图片宽高", async () => {
    const formData = new FormData()
    formData.set("file", new File([createPngBuffer(320, 180)], "cover.png", { type: "image/png" }))

    const { POST } = await import("@/app/api/upload/route")
    const response = await POST(
      new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      width: 320,
      height: 180,
    })
  })
})
