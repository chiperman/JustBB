// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { Memo } from "@/types/memo"
import { UnlockedMemosProvider, useUnlockedMemos } from "./UnlockedMemosContext"

const unlockedMemo = {
  id: "memo-1",
  content: "已解锁内容",
} as Memo

const newMemo = {
  id: "memo-2",
  content: "新解锁内容",
} as Memo

function Consumer() {
  const { getUnlockedMemo, storeUnlockedMemo, verifiedPasswords, addVerifiedPassword } =
    useUnlockedMemos()

  return (
    <div>
      <span>{getUnlockedMemo("memo-1")?.content}</span>
      <span>{verifiedPasswords.join(",")}</span>
      <button onClick={() => storeUnlockedMemo(newMemo)}>解锁</button>
      <button onClick={() => addVerifiedPassword("123456")}>记录口令</button>
    </div>
  )
}

describe("UnlockedMemosProvider", () => {
  it("应支持继承已有解锁状态，并把新解锁结果回写给父级", () => {
    const onStoreUnlockedMemo = vi.fn()
    const onAddVerifiedPassword = vi.fn()

    render(
      <UnlockedMemosProvider
        initialUnlockedMemos={{ [unlockedMemo.id]: unlockedMemo }}
        initialVerifiedPasswords={["000000"]}
        onStoreUnlockedMemo={onStoreUnlockedMemo}
        onAddVerifiedPassword={onAddVerifiedPassword}
      >
        <Consumer />
      </UnlockedMemosProvider>
    )

    expect(screen.getByText("已解锁内容")).toBeDefined()
    expect(screen.getByText("000000")).toBeDefined()

    fireEvent.click(screen.getByText("解锁"))
    fireEvent.click(screen.getByText("记录口令"))

    expect(onStoreUnlockedMemo).toHaveBeenCalledWith(newMemo)
    expect(onAddVerifiedPassword).toHaveBeenCalledWith("123456")
  })
})
