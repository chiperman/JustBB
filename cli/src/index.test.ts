import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  deleteMemo,
  openBrowser,
  pollDeviceAuth,
  publishMemo,
  promptEnter,
  promptSecret,
  promptText,
  readSession,
  showMemo,
  startDeviceAuth,
  unlockMemo,
  updateMemo,
  writeSession,
  clearSession,
  editText,
} = vi.hoisted(() => ({
  deleteMemo: vi.fn(),
  openBrowser: vi.fn(),
  pollDeviceAuth: vi.fn(),
  publishMemo: vi.fn(),
  promptEnter: vi.fn(),
  promptSecret: vi.fn(),
  promptText: vi.fn(),
  readSession: vi.fn(),
  showMemo: vi.fn(),
  startDeviceAuth: vi.fn(),
  unlockMemo: vi.fn(),
  updateMemo: vi.fn(),
  writeSession: vi.fn(),
  clearSession: vi.fn(),
  editText: vi.fn(),
}))

vi.mock("./client.js", () => ({
  getCliCurrentUser: vi.fn(),
  deleteMemo,
  emptyTrash: vi.fn(),
  listTrash: vi.fn(),
  pollDeviceAuth,
  purgeTrashMemo: vi.fn(),
  publishMemo,
  restoreTrashMemo: vi.fn(),
  searchMemos: vi.fn(),
  showMemo,
  showTrashMemo: vi.fn(),
  startDeviceAuth,
  updateMemo,
  unlockMemo,
}))

vi.mock("./prompt.js", () => ({
  confirmDangerousAction: vi.fn(),
  promptEnter,
  promptSecret,
  promptText,
}))

vi.mock("./auth-store.js", () => ({ readSession, writeSession, clearSession }))
vi.mock("./editor.js", () => ({ editText }))
vi.mock("./browser.js", () => ({ openBrowser }))

import { run } from "./index.js"

describe("CLI 私密发布", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    publishMemo.mockResolvedValue({ success: true, data: { memo_number: 123 }, error: null })
    updateMemo.mockResolvedValue({ success: true, data: { memo_number: 17 }, error: null })
    deleteMemo.mockResolvedValue({ success: true, data: { memo_number: 17 }, error: null })
  })

  it("两次口令一致后才发布", async () => {
    promptSecret.mockResolvedValueOnce("secret").mockResolvedValueOnce("secret")
    promptText.mockResolvedValueOnce("hint")

    await expect(run(["publish", "私密内容", "--private"])).resolves.toBe(0)

    expect(promptSecret).toHaveBeenNthCalledWith(1, "Access code: ")
    expect(promptSecret).toHaveBeenNthCalledWith(2, "Confirm access code: ")
    expect(publishMemo).toHaveBeenCalledWith(
      expect.objectContaining({ access_code: "secret", access_code_hint: "hint", is_private: true })
    )
  })

  it("等待确认后才打开浏览器授权页", async () => {
    vi.useFakeTimers()
    promptEnter.mockResolvedValue(true)
    openBrowser.mockReturnValue(true)
    startDeviceAuth.mockResolvedValue({
      success: true,
      data: {
        request_id: "request-1",
        authorize_url: "https://example.com/cli/authorize?request=request-1",
        code: "A7K2P9",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    })
    pollDeviceAuth.mockResolvedValue({
      success: true,
      data: { status: "approved", access_token: "access", refresh_token: "refresh" },
      error: null,
    })

    const promise = run(["login"])
    await vi.advanceTimersByTimeAsync(1_000)

    await expect(promise).resolves.toBe(0)
    expect(promptEnter).toHaveBeenCalledWith("Press ENTER to open in your browser...")
    expect(openBrowser).toHaveBeenCalledWith("https://example.com/cli/authorize?request=request-1")

    vi.useRealTimers()
  })

  it("解锁时 --json 的 stdout 只输出 JSON", async () => {
    showMemo.mockResolvedValueOnce({
      success: true,
      data: { memo_number: 17, is_locked: true, access_code_hint: "travel notes" },
      error: null,
    })
    unlockMemo.mockResolvedValueOnce({
      success: true,
      data: { memo_number: 17, content: "unlocked", is_locked: false },
      error: null,
    })
    promptSecret.mockResolvedValueOnce("secret")
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    await expect(run(["show", "17", "--unlock", "--json"])).resolves.toBe(0)

    expect(promptSecret).toHaveBeenCalledWith("Access code: ", true)
    expect(stdout).toHaveBeenCalledWith(
      `${JSON.stringify({
        success: true,
        data: { memo_number: 17, content: "unlocked", is_locked: false },
        error: null,
      })}\n`
    )
    expect(stderr).toHaveBeenCalledWith("Access code hint: travel notes\n")
  })

  it("show --edit --json 不在 stdout 输出编辑前预览", async () => {
    const updated = {
      success: true,
      data: {
        memo_number: 17,
        content: "edited",
        created_at: "2026-07-12T00:00:00.000Z",
        is_locked: false,
      },
      error: null,
    }
    const current = {
      success: true,
      data: {
        memo_number: 17,
        content: "before",
        created_at: "2026-07-12T00:00:00.000Z",
        images: [],
        is_locked: false,
      },
      error: null,
    }
    showMemo.mockResolvedValueOnce(current)
    editText.mockResolvedValueOnce("edited")
    updateMemo.mockResolvedValueOnce(updated)
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(run(["show", "17", "--edit", "--json"])).resolves.toBe(0)

    expect(showMemo).toHaveBeenCalledTimes(1)
    expect(stdout).toHaveBeenCalledWith(`${JSON.stringify(updated)}\n`)
    expect(stdout).toHaveBeenCalledTimes(1)
  })

  it("show --edit 普通模式先输出预览再打开编辑器", async () => {
    const current = {
      success: true,
      data: {
        memo_number: 17,
        content: "before",
        created_at: "2026-07-12T00:00:00.000Z",
        images: [],
        is_locked: false,
      },
      error: null,
    }
    const updated = {
      success: true,
      data: {
        memo_number: 17,
        content: "after",
        created_at: "2026-07-12T00:00:00.000Z",
        is_locked: false,
      },
      error: null,
    }
    showMemo.mockResolvedValueOnce(current)
    editText.mockResolvedValueOnce("after")
    updateMemo.mockResolvedValueOnce(updated)
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(run(["show", "17", "--edit"])).resolves.toBe(0)

    expect(showMemo).toHaveBeenCalledTimes(1)
    // 第一次输出应该是预览
    expect(stdout.mock.calls[0][0]).toContain("before")
    // 第二次输出是更新确认
    expect(stdout.mock.calls[1][0]).toContain("Updated Memo #17")
  })

  it("show --edit 遇到空数据时不会再次读取 Memo", async () => {
    showMemo.mockResolvedValueOnce({ success: true, data: null, error: null })
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    await expect(run(["show", "17", "--edit"])).resolves.toBe(1)

    expect(showMemo).toHaveBeenCalledTimes(1)
    expect(stderr).toHaveBeenCalledWith("Cannot edit a locked private Memo.\n")
  })

  it.each([
    ["pin", ["show", "17", "--pin"], { is_pinned: true }],
    ["unpin", ["show", "17", "--unpin"], { is_pinned: false }],
    ["public", ["show", "17", "--public"], { is_private: false }],
  ])("show --%s 不额外读取 Memo", async (_action, args, input) => {
    await expect(run(args)).resolves.toBe(0)

    expect(showMemo).not.toHaveBeenCalled()
    expect(updateMemo).toHaveBeenCalledTimes(1)
    expect(updateMemo).toHaveBeenCalledWith("17", input)
  })

  it("show --private 不额外读取 Memo", async () => {
    promptSecret.mockResolvedValueOnce("secret").mockResolvedValueOnce("secret")
    promptText.mockResolvedValueOnce("hint")

    await expect(run(["show", "17", "--private"])).resolves.toBe(0)

    expect(showMemo).not.toHaveBeenCalled()
    expect(updateMemo).toHaveBeenCalledTimes(1)
    expect(updateMemo).toHaveBeenCalledWith("17", {
      is_private: true,
      access_code: "secret",
      access_code_hint: "hint",
    })
  })

  it("show --delete 不额外读取 Memo", async () => {
    await expect(run(["show", "17", "--delete"])).resolves.toBe(0)

    expect(showMemo).not.toHaveBeenCalled()
    expect(deleteMemo).toHaveBeenCalledTimes(1)
    expect(deleteMemo).toHaveBeenCalledWith("17")
  })

  it("轮询临时网络错误后恢复并成功登录", async () => {
    vi.useFakeTimers()
    promptEnter.mockResolvedValue(true)
    openBrowser.mockReturnValue(true)
    startDeviceAuth.mockResolvedValue({
      success: true,
      data: {
        request_id: "request-1",
        authorize_url: "https://example.com/cli/authorize?request=request-1",
        code: "A7K2P9",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    })
    pollDeviceAuth.mockRejectedValueOnce(new Error("fetch failed")).mockResolvedValueOnce({
      success: true,
      data: { status: "approved", access_token: "access", refresh_token: "refresh" },
      error: null,
    })

    const promise = run(["login"])
    await vi.advanceTimersByTimeAsync(1_000)
    await vi.advanceTimersByTimeAsync(2_000)

    await expect(promise).resolves.toBe(0)
    expect(pollDeviceAuth).toHaveBeenCalledTimes(2)

    vi.useRealTimers()
  })

  it("轮询连续三次网络失败后抛出原始错误", async () => {
    vi.useFakeTimers()
    promptEnter.mockResolvedValue(true)
    openBrowser.mockReturnValue(true)
    startDeviceAuth.mockResolvedValue({
      success: true,
      data: {
        request_id: "request-1",
        authorize_url: "https://example.com/cli/authorize?request=request-1",
        code: "A7K2P9",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    })
    const networkError = new Error("DNS resolution failed")
    pollDeviceAuth.mockRejectedValue(networkError)
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    const promise = run(["login"])
    await vi.advanceTimersByTimeAsync(1_000)
    await vi.advanceTimersByTimeAsync(2_000)
    await vi.advanceTimersByTimeAsync(3_000)

    await expect(promise).resolves.toBe(1)
    expect(pollDeviceAuth).toHaveBeenCalledTimes(3)
    expect(stderr).toHaveBeenCalledWith("DNS resolution failed\n")

    vi.useRealTimers()
  })

  it("普通账号被拒绝时立即结束登录，不继续轮询", async () => {
    vi.useFakeTimers()
    promptEnter.mockResolvedValue(true)
    openBrowser.mockReturnValue(true)
    startDeviceAuth.mockResolvedValue({
      success: true,
      data: {
        request_id: "request-1",
        authorize_url: "https://example.com/cli/authorize?request=request-1",
        code: "A7K2P9",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      error: null,
    })
    pollDeviceAuth.mockRejectedValue(new Error("CLI access is restricted to administrators."))
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true)

    const promise = run(["login"])
    await vi.advanceTimersByTimeAsync(1_000)

    await expect(promise).resolves.toBe(1)
    expect(pollDeviceAuth).toHaveBeenCalledTimes(1)
    expect(stderr).toHaveBeenCalledWith("CLI access is restricted to administrators.\n")

    vi.useRealTimers()
  })
})
