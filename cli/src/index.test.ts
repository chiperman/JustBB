import { beforeEach, describe, expect, it, vi } from "vitest"

const {
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
  deleteMemo: vi.fn(),
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
    showMemo.mockResolvedValueOnce(current).mockResolvedValueOnce(current)
    editText.mockResolvedValueOnce("edited")
    updateMemo.mockResolvedValueOnce(updated)
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await expect(run(["show", "17", "--edit", "--json"])).resolves.toBe(0)

    expect(stdout).toHaveBeenCalledWith(`${JSON.stringify(updated)}\n`)
    expect(stdout).toHaveBeenCalledTimes(1)
  })
})
