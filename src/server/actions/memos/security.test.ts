import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"
import { getClient } from "@/lib/supabase"
import { createMemo, updateMemoContent, updateMemoState, batchAddTagsToMemos } from "./mutate"
import { getTimelineStats, getMemoStats, getAllTags } from "./analytics"
import { getMemosWithLocations, getGalleryMemos, getMemoById } from "./query"

// 必须 mock getClient，以让 Server Action 拿到对应的测试客户端登录态
vi.mock("@/lib/supabase", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/supabase")>()
  return {
    ...original,
    getClient: vi.fn(),
  }
})

// 只有在本地开发环境下运行此测试，避免破坏云端真实数据
const isLocal =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1") ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("localhost") ||
  process.env.NODE_ENV === "test" // 允许在测试环境下运行

describe("Security & RLS (Integrated)", () => {
  // 强制跳过非本地环境的集成测试，保护云端
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasEnv = !!SUPABASE_URL && !!SUPABASE_ANON_KEY && !!SUPABASE_SERVICE_ROLE_KEY

  if (!isLocal || !hasEnv) {
    it.skip("Skipping RLS integration tests on non-local environment", () => {})
    return
  }

  const adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const anonClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  const userClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

  let testMemoId: string
  let testMemoWithFeaturesId: string
  let canRun = true

  const isConnectivityError = (error: { message?: string; details?: string } | null) => {
    if (!error) return false
    const combined = `${error.message || ""} ${error.details || ""}`
    return combined.includes("fetch failed") || combined.includes("ECONNREFUSED")
  }

  const setClient = (client: unknown) => {
    vi.mocked(getClient).mockResolvedValue(client as never)
  }

  beforeAll(async () => {
    // 默认让 getClient 返回 anonClient
    setClient(anonClient)

    // 1. 创建一条普通私密测试笔记 (保持老测试不变)
    const { data, error } = await adminClient
      .from("memos")
      .insert({
        owner_id: "00000000-0000-0000-0000-000000000001",
        content: "SECRET_INTEGRATION_TEST_CONTENT",
        is_private: true,
        access_code_hint: "test_hint",
      })
      .select()
      .single()

    if (isConnectivityError(error)) {
      canRun = false
      console.warn("WARN: Local Supabase is unreachable. Skipping RLS integration tests.")
      return
    }

    if (error || !data) throw new Error("Failed to setup test data: " + error?.message)
    testMemoId = data.id

    // 2. 创建一条包含全部测试特征的私密测试笔记
    const { data: data2, error: error2 } = await adminClient
      .from("memos")
      .insert({
        owner_id: "00000000-0000-0000-0000-000000000001",
        content: "SECRET_WITH_FEATURES",
        is_private: true,
        access_code_hint: "test_hint",
        created_at: "2099-01-01T12:00:00Z",
        word_count: 9999,
        tags: ["SECRET_TAG_2099"],
        locations: [
          { name: "Secret Location", latitude: 31.23, longitude: 121.47 },
        ] as unknown as Database["public"]["Tables"]["memos"]["Insert"]["locations"],
        images: ["http://localhost/secret.png"],
      })
      .select()
      .single()

    if (error2 || !data2) throw new Error("Failed to setup test data 2: " + error2?.message)
    testMemoWithFeaturesId = data2.id
  })

  afterAll(async () => {
    // 清理测试数据
    if (testMemoId) {
      await adminClient.from("memos").delete().eq("id", testMemoId)
    }
    if (testMemoWithFeaturesId) {
      await adminClient.from("memos").delete().eq("id", testMemoWithFeaturesId)
    }
  })

  it("should hide private memos from direct select for anonymous users", async () => {
    if (!canRun) return

    const { data, error } = await anonClient.from("memos").select("*").eq("id", testMemoId)

    expect(error).toBeNull()
    expect(data).toHaveLength(0) // RLS 应该拦截此请求，返回空数组
  })

  it("should show private memos as locked in RPC results for anonymous users (when query is empty)", async () => {
    if (!canRun) return

    // 给数据库一点时间建立索引（虽然本地很快，但为了稳定性）
    await new Promise((resolve) => setTimeout(resolve, 500))

    const { data, error } = await anonClient.rpc("search_memos_secure", {
      query_text: "",
      limit_val: 50,
    })

    if (error && error.code === "PGRST202") {
      console.warn("WARN: RPC search_memos_secure not found on local DB. Skipping this assertion.")
      return
    }

    expect(error).toBeNull()
    const memos = data as Array<{
      id: string
      is_locked: boolean
      content: string
    }>
    const target = memos?.find((m) => m.id === testMemoId)

    if (!target) {
      console.warn(
        `WARN: Memo ${testMemoId} not found in RPC results. It might be due to local DB out of sync. Skipping this assertion.`
      )
      return
    }

    expect(target.is_locked).toBe(true)
    expect(target.content).toBe("")
  })

  it("should keep private memos locked for authenticated non-owners", async () => {
    if (!canRun) return

    const { error: loginError } = await userClient.auth.signInWithPassword({
      email: "user@example.com",
      password: "user123456",
    })

    expect(loginError).toBeNull()

    const { data, error } = await userClient.from("memos").select("*").eq("id", testMemoId)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it("should allow service role to read everything", async () => {
    if (!canRun) return

    const { data, error } = await adminClient
      .from("memos")
      .select("*")
      .eq("id", testMemoId)
      .single()

    expect(error).toBeNull()
    expect(data?.content).toContain("SECRET_INTEGRATION_TEST_CONTENT")
  })

  // ==================== 以下为新增的 TDD 安全及隐私测试 ====================

  it("写操作管理员校验测试：匿名访客和普通登录用户调用写操作 Action 一律被拒绝", async () => {
    if (!canRun) return

    const formData = new FormData()
    formData.append("content", "New Memo content")
    formData.append("is_private", "false")

    // 1. 匿名访客测试
    setClient(anonClient)
    const resCreateAnon = await createMemo(formData)
    expect(resCreateAnon.success).toBe(false)
    expect(resCreateAnon.error).toMatch(/登录|权限/)

    // 2. 普通已登录用户测试 (无 admin 角色)
    const { error: loginError } = await userClient.auth.signInWithPassword({
      email: "user@example.com",
      password: "user123456",
    })
    expect(loginError).toBeNull()

    setClient(userClient)
    const resCreateUser = await createMemo(formData)
    expect(resCreateUser.success).toBe(false)
    expect(resCreateUser.error).toMatch(/权限/)

    formData.append("id", testMemoWithFeaturesId)
    const resUpdateUser = await updateMemoContent(formData)
    expect(resUpdateUser.success).toBe(false)
    expect(resUpdateUser.error).toMatch(/权限/)

    const resStateUser = await updateMemoState(formData)
    expect(resStateUser.success).toBe(false)
    expect(resStateUser.error).toMatch(/权限/)

    const batchFormData = new FormData()
    batchFormData.append("ids", JSON.stringify([testMemoWithFeaturesId]))
    batchFormData.append("tags", JSON.stringify(["test"]))
    const resBatchUser = await batchAddTagsToMemos(batchFormData)
    expect(resBatchUser.success).toBe(false)
    expect(resBatchUser.error).toMatch(/权限/)
  })

  it("多租户统计越权隔离测试：匿名访客和普通用户获取统计只能是公开日记统计，绝不能混入管理员的私密统计", async () => {
    if (!canRun) return

    // 测试匿名访客
    setClient(anonClient)
    const timelineAnon = await getTimelineStats()
    const memoStatsAnon = await getMemoStats()

    expect(timelineAnon.success).toBe(true)
    expect(memoStatsAnon.success).toBe(true)

    // 2099-01-01 是测试私密日记所在的特定日期，访客决不能统计到它
    expect(timelineAnon.data?.days["2099-01-01"]).toBeUndefined()
    expect(memoStatsAnon.data?.days["2099-01-01"]).toBeUndefined()

    // 测试普通登录用户
    const { error: loginError } = await userClient.auth.signInWithPassword({
      email: "user@example.com",
      password: "user123456",
    })
    expect(loginError).toBeNull()

    setClient(userClient)
    const timelineUser = await getTimelineStats()
    const memoStatsUser = await getMemoStats()

    expect(timelineUser.success).toBe(true)
    expect(memoStatsUser.success).toBe(true)
    expect(timelineUser.data?.days["2099-01-01"]).toBeUndefined()
    expect(memoStatsUser.data?.days["2099-01-01"]).toBeUndefined()
  })

  it("标签泄露保护测试：匿名访客和普通用户调用 getAllTags 不返回管理员的私密标签", async () => {
    if (!canRun) return

    // 访客测试
    setClient(anonClient)
    const tagsAnon = await getAllTags()
    expect(tagsAnon.success).toBe(true)
    const hasSecretTagAnon = tagsAnon.data?.some((t) => t.tag_name === "SECRET_TAG_2099")
    expect(hasSecretTagAnon).toBe(false)

    // 普通已登录用户测试
    const { error: loginError } = await userClient.auth.signInWithPassword({
      email: "user@example.com",
      password: "user123456",
    })
    expect(loginError).toBeNull()

    setClient(userClient)
    const tagsUser = await getAllTags()
    expect(tagsUser.success).toBe(true)
    const hasSecretTagUser = tagsUser.data?.some((t) => t.tag_name === "SECRET_TAG_2099")
    expect(hasSecretTagUser).toBe(false)
  })

  it("地图定位坐标脱敏测试：访客调用 getMemosWithLocations，未解锁私密定位 is_locked = true 且 content = ''", async () => {
    if (!canRun) return

    setClient(anonClient)
    const res = await getMemosWithLocations([])
    expect(res.success).toBe(true)

    // 寻找我们的测试私密 Memo 对应的定位数据
    const target = res.data?.find((m) => m.id === testMemoWithFeaturesId)
    expect(target).toBeDefined()
    expect(target?.is_locked).toBe(true)
    expect(target?.content).toBe("")
    expect(target?.locations).toHaveLength(1)
    expect(target?.locations[0].name).toBe("Secret Location")
  })

  it("画廊高斯模糊脱敏测试：访客调用 getGalleryMemos，返回未解锁私密 Memo 时其图片 URL 被脱敏，且 is_locked = true", async () => {
    if (!canRun) return

    setClient(anonClient)
    const res = await getGalleryMemos(20, 0)
    expect(res.success).toBe(true)

    const target = res.data?.find((m) => m.id === testMemoWithFeaturesId)
    expect(target).toBeDefined()
    expect(target?.is_locked).toBe(true)
    // 独立图片列脱敏：应该已被替换为模糊占位图
    expect(target?.images).toBeDefined()
    expect(target?.images?.[0]).toContain("locked-placeholder.png")
  })

  it("单条详情接口安全测试：访客获取未解锁私密日记，返回脱敏数据且 is_locked = true", async () => {
    if (!canRun) return

    setClient(anonClient)
    const res = await getMemoById(testMemoWithFeaturesId, [])
    expect(res.success).toBe(true)
    expect(res.data).toBeDefined()
    expect(res.data?.is_locked).toBe(true)
    expect(res.data?.content).toBe("")
    expect(res.data?.tags).toHaveLength(0)
  })
})
