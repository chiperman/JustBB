// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { ConfirmProvider, useConfirm } from "./ConfirmContext"

function TestConsumer() {
  const { confirm, alert, prompt } = useConfirm()
  return (
    <div>
      <button
        data-testid="btn-confirm"
        onClick={() =>
          confirm({
            title: "Are you sure?",
            description: "This action cannot be undone",
          })
        }
      >
        Confirm
      </button>
      <button
        data-testid="btn-alert"
        onClick={() => alert({ title: "Alert title", description: "Alert description" })}
      >
        Alert
      </button>
      <button
        data-testid="btn-prompt"
        onClick={() =>
          prompt({
            title: "Enter name",
            label: "Name",
            placeholder: "Your name",
            defaultValue: "default",
          })
        }
      >
        Prompt
      </button>
    </div>
  )
}

describe("ConfirmProvider", () => {
  it("confirm 点击确定应返回 true", async () => {
    let resolved = false
    let promiseResult: boolean | null = null

    function TestWrapper() {
      const { confirm } = useConfirm()
      React.useEffect(() => {
        act(() => {
          confirm({ title: "Are you sure?" }).then((result) => {
            promiseResult = result
            resolved = true
          })
        })
      }, [confirm])
      return <TestConsumer />
    }

    const { getByText } = render(
      <ConfirmProvider>
        <TestWrapper />
      </ConfirmProvider>
    )

    expect(await screen.findByText("Are you sure?")).toBeDefined()
    expect(screen.getByText("请确认当前操作。")).toBeDefined()
    fireEvent.click(getByText("确定"))

    await waitFor(() => expect(promiseResult).toBe(true))
    expect(resolved).toBe(true)
  })

  it("confirm 点击取消应返回 false", async () => {
    let resolved = false
    let promiseResult: boolean | null = null

    function TestWrapper() {
      const { confirm } = useConfirm()
      React.useEffect(() => {
        act(() => {
          confirm({ title: "Are you sure?" }).then((result) => {
            promiseResult = result
            resolved = true
          })
        })
      }, [confirm])
      return <TestConsumer />
    }

    const { getByText } = render(
      <ConfirmProvider>
        <TestWrapper />
      </ConfirmProvider>
    )

    expect(await screen.findByText("Are you sure?")).toBeDefined()
    fireEvent.click(getByText("取消"))

    await waitFor(() => expect(promiseResult).toBe(false))
    expect(resolved).toBe(true)
  })

  it("alert 应显示无取消按钮的对话框", async () => {
    function TestWrapper() {
      const { alert } = useConfirm()
      React.useEffect(() => {
        act(() => {
          alert({ title: "Alert title", description: "Alert description" })
        })
      }, [alert])
      return <TestConsumer />
    }

    render(
      <ConfirmProvider>
        <TestWrapper />
      </ConfirmProvider>
    )

    expect(screen.getByText("Alert title")).toBeDefined()
    expect(screen.getByText("Alert description")).toBeDefined()
    expect(screen.getByText("确定")).toBeDefined()
  })
})
