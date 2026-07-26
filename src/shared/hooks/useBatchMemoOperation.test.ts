import { describe, expect, it, vi } from "vitest"
import { executeBatchMemoOperation, type BatchMemoOperation } from "./useBatchMemoOperation"

function createDependencies() {
  return {
    confirm: vi.fn(async () => true),
    toast: vi.fn(),
    setPending: vi.fn(),
    dispatch: vi.fn(),
    clearSelection: vi.fn(),
    refreshTags: vi.fn(),
    refreshStats: vi.fn(),
    refreshRoute: vi.fn(),
  }
}

describe("executeBatchMemoOperation", () => {
  it("取消确认时不执行操作", async () => {
    const dependencies = createDependencies()
    dependencies.confirm.mockResolvedValueOnce(false)
    const action = vi.fn()

    const result = await executeBatchMemoOperation(
      ["memo-1"],
      {
        confirmation: {
          title: "确认",
          description: "确认操作",
          confirmLabel: "继续",
        },
        action,
        successToast: () => ({ title: "完成" }),
        failureTitle: "失败",
      },
      dependencies
    )

    expect(result).toBe(false)
    expect(action).not.toHaveBeenCalled()
    expect(dependencies.setPending).not.toHaveBeenCalled()
  })

  it("成功时统一派发事件、清理选择并刷新派生数据", async () => {
    const dependencies = createDependencies()
    const operation: BatchMemoOperation<{ updated: boolean }> = {
      action: vi.fn(async () => ({ success: true, error: null, data: { updated: true } })),
      successToast: (count) => ({ title: "已完成", description: `${count} 条` }),
      failureTitle: "失败",
      events: (ids) => ids.map((id) => ({ type: "delete" as const, id })),
    }

    await expect(
      executeBatchMemoOperation(["memo-1", "memo-2"], operation, dependencies)
    ).resolves.toBe(true)

    expect(dependencies.setPending.mock.calls).toEqual([[true], [false]])
    expect(dependencies.dispatch).toHaveBeenCalledTimes(2)
    expect(dependencies.clearSelection).toHaveBeenCalledOnce()
    expect(dependencies.refreshTags).toHaveBeenCalledOnce()
    expect(dependencies.refreshStats).toHaveBeenCalledOnce()
    expect(dependencies.refreshRoute).toHaveBeenCalledOnce()
  })

  it("失败时保留选择，只显示统一错误并完成收尾", async () => {
    const dependencies = createDependencies()
    const onSettled = vi.fn()

    const result = await executeBatchMemoOperation(
      ["memo-1"],
      {
        action: vi.fn(async () => ({ success: false, error: "数据库失败" })),
        successToast: () => ({ title: "已完成" }),
        failureTitle: "操作失败",
        onSettled,
      },
      dependencies
    )

    expect(result).toBe(false)
    expect(dependencies.toast).toHaveBeenCalledWith({
      title: "操作失败",
      description: "数据库失败",
      variant: "destructive",
    })
    expect(dependencies.clearSelection).not.toHaveBeenCalled()
    expect(dependencies.setPending.mock.calls).toEqual([[true], [false]])
    expect(onSettled).toHaveBeenCalledOnce()
  })
})
