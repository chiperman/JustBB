// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { refreshTags, renameTagForCurrentUser } = vi.hoisted(() => ({
  refreshTags: vi.fn().mockResolvedValue(undefined),
  renameTagForCurrentUser: vi.fn().mockResolvedValue({
    success: true,
    data: { count: 1 },
    error: null,
  }),
}))

vi.mock("./hooks/useTagGroups", () => ({
  useTagGroups: () => ({
    tags: [{ tag_name: "旧标签", count: 1 }],
    isLoading: false,
    refreshTags,
  }),
}))

vi.mock("./components/TagCard", () => ({
  TagCard: () => null,
}))

vi.mock("@/shared/layout/ContextPageShell", () => ({
  ContextPageShell: ({
    children,
    header,
  }: {
    children: React.ReactNode
    header: React.ReactNode
  }) => (
    <>
      {header}
      {children}
    </>
  ),
  ContextPageHeader: ({ title, actions }: { title: string; actions: React.ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}))

vi.mock("@/shared/ui/PageEmptyState", () => ({
  PageEmptyState: () => null,
}))

vi.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/server/actions/memos/mutate", () => ({
  renameTagForCurrentUser,
}))

vi.mock("@/lib/memos/events", () => ({
  dispatchMemoEvent: vi.fn(),
}))

import { TagsPageContent } from "./index"

describe("TagsPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("重命名完成后关闭弹窗，不等待标签列表刷新", async () => {
    refreshTags.mockReturnValueOnce(new Promise(() => {}))
    render(<TagsPageContent />)

    fireEvent.click(screen.getByRole("button", { name: "重命名" }))
    fireEvent.change(screen.getByRole("textbox", { name: "新标签" }), {
      target: { value: "新标签" },
    })
    fireEvent.click(screen.getByRole("button", { name: "继续" }))
    fireEvent.click(screen.getByRole("button", { name: "确认重命名" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull(), { timeout: 2_000 })
    expect(renameTagForCurrentUser).toHaveBeenCalledWith("旧标签", "新标签")
    expect(refreshTags).toHaveBeenCalled()
  })
})
