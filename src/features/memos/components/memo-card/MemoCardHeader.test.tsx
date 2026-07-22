// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Memo } from "@/types/memo"
import { TooltipProvider } from "@/shared/ui/tooltip"

vi.mock("../MemoActions", () => ({
  MemoActions: () => null,
}))

import { MemoCardHeader } from "./MemoCardHeader"

const memo = {
  id: "memo-42",
  memo_number: 42,
  content: "测试内容",
  created_at: "2026-07-12T00:00:00.000Z",
  updated_at: "2026-07-12T00:00:00.000Z",
  owner_id: "owner-1",
  tags: [],
  is_pinned: false,
  pinned_at: null,
  is_private: false,
  deleted_at: null,
  word_count: 4,
  access_code_hint: null,
  is_owner: true,
} as Memo

describe("MemoCardHeader", () => {
  it("将引用开关保留在卡片外层按钮", () => {
    render(
      <TooltipProvider>
        <MemoCardHeader
          memo={memo}
          isSelectionMode={false}
          isSelected={false}
          onToggleSelection={vi.fn()}
          showOriginalOnly={false}
          showBacklinks
          onToggleBacklinks={vi.fn()}
          onEdit={vi.fn()}
          onMenuOpenChange={vi.fn()}
          isMenuOpen={false}
          hasMounted
        />
      </TooltipProvider>
    )

    expect(screen.getByRole("button", { name: "隐藏引用" })).toBeTruthy()
  })

  it("多选模式在卡片左侧提供可访问的勾选框", () => {
    render(
      <MemoCardHeader
        memo={memo}
        isSelectionMode
        isSelected={false}
        onToggleSelection={vi.fn()}
        showOriginalOnly
        showBacklinks={false}
        onToggleBacklinks={vi.fn()}
        onEdit={vi.fn()}
        onMenuOpenChange={vi.fn()}
        isMenuOpen={false}
        hasMounted
      />
    )

    expect(screen.getByRole("checkbox", { name: "选择 Memo #42" })).toBeTruthy()
  })
})
