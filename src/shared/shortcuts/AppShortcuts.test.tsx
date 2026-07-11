// @vitest-environment jsdom

import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OPEN_KEYBOARD_SHORTCUTS_EVENT } from "./events"
import type { ShortcutRegistration } from "./types"

const mockPush = vi.hoisted(() => vi.fn())
const shortcutRegistrations = vi.hoisted(() => [] as ShortcutRegistration[])
const mockState = vi.hoisted(() => ({
  pathname: "/",
  user: { id: "u1", email: "user@example.com", created_at: "", role: "user" } as {
    id: string
    email: string
    created_at: string
    role: string
  } | null,
  isSelectionMode: false,
  selectedIds: new Set<string>(),
  registeredMemoIds: [] as string[],
  toggleSelectionMode: vi.fn(),
  clearSelection: vi.fn(),
  selectAll: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => mockState.pathname,
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock("@/state/UserContext", () => ({
  useUser: () => ({
    user: mockState.user,
  }),
}))

vi.mock("@/state/UIContext", () => ({
  useUI: () => ({
    isSelectionMode: mockState.isSelectionMode,
    selectedIds: mockState.selectedIds,
    toggleSelectionMode: mockState.toggleSelectionMode,
    clearSelection: mockState.clearSelection,
    selectAll: mockState.selectAll,
    getRegisteredMemoIds: () => mockState.registeredMemoIds,
  }),
}))

vi.mock("./useShortcut", () => ({
  useShortcut: (shortcut: ShortcutRegistration) => {
    shortcutRegistrations.push(shortcut)
  },
}))

import { AppShortcuts } from "./AppShortcuts"

function renderAppShortcuts() {
  render(<AppShortcuts />)
}

function shortcut(id: string): ShortcutRegistration {
  const registration = shortcutRegistrations.find((item) => item.id === id)
  if (!registration) {
    throw new Error(`未注册快捷键：${id}`)
  }

  return registration
}

describe("AppShortcuts", () => {
  beforeEach(() => {
    mockPush.mockClear()
    shortcutRegistrations.length = 0
    mockState.pathname = "/"
    mockState.user = { id: "u1", email: "user@example.com", created_at: "", role: "user" }
    mockState.isSelectionMode = false
    mockState.selectedIds = new Set()
    mockState.registeredMemoIds = []
    mockState.toggleSelectionMode.mockClear()
    mockState.clearSelection.mockClear()
    mockState.selectAll.mockClear()
  })

  it("注册不会被浏览器稳定劫持的 Command/Ctrl 快捷键", () => {
    renderAppShortcuts()

    expect(shortcut("app.shortcuts.help.open").binding).toBe("mod+/")
    expect(shortcut("app.shortcuts.help.open").allowBrowserReservedShortcut).toBe(true)
    expect(shortcut("app.scroll.top").binding).toBe("mod+arrowup")
    expect(shortcut("app.create.focus").binding).toBe("mod+enter")

    expect(shortcutRegistrations.some((item) => item.group === "导航")).toBe(false)
  })

  it("非首页 Mod+Enter 快捷键回到首页", () => {
    mockState.pathname = "/tags"
    renderAppShortcuts()

    shortcut("app.create.focus").handler(
      new KeyboardEvent("keydown", { key: "Enter", metaKey: true })
    )

    expect(mockPush).toHaveBeenCalledWith("/")
  })

  it("首页 Mod+Enter 快捷键直接触发新建编辑器聚焦事件", () => {
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent")
    mockState.pathname = "/"
    renderAppShortcuts()

    shortcut("app.create.focus").handler(
      new KeyboardEvent("keydown", { key: "Enter", metaKey: true })
    )

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "justmemo:focus-create-editor" })
    )
    dispatchEventSpy.mockRestore()
  })

  it("Mod+ArrowUp 快捷键滚动当前页面容器到顶部", () => {
    document.body.innerHTML = `<div data-shortcut-scroll-root="true"></div>`
    const scrollRoot = document.querySelector<HTMLElement>("[data-shortcut-scroll-root='true']")
    const scrollTo = vi.fn()
    Object.assign(scrollRoot!, { scrollTo })
    renderAppShortcuts()

    shortcut("app.scroll.top").handler(
      new KeyboardEvent("keydown", { key: "ArrowUp", metaKey: true })
    )

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" })
  })

  it("响应设置菜单事件打开快捷键指南", () => {
    renderAppShortcuts()

    act(() => {
      window.dispatchEvent(new Event(OPEN_KEYBOARD_SHORTCUTS_EVENT))
    })

    expect(screen.getByRole("dialog")).toBeTruthy()
    expect(screen.getByText("快捷键")).toBeTruthy()
  })

  it("未登录用户不会通过快捷键切换选择模式", () => {
    mockState.user = null
    renderAppShortcuts()

    const toggleSelection = shortcut("app.selection.toggle")

    expect(toggleSelection.enabled).toBe(false)

    toggleSelection.handler(new KeyboardEvent("keydown", { key: "x", metaKey: true }))

    expect(mockPush).not.toHaveBeenCalled()
    expect(mockState.toggleSelectionMode).not.toHaveBeenCalled()
  })

  it("登录用户可以从交互控件焦点切换选择模式", () => {
    renderAppShortcuts()

    const toggleSelection = shortcut("app.selection.toggle")

    expect(toggleSelection.binding).toBe("mod+shift+x")
    expect(toggleSelection.allowInInteractiveTarget).toBe(true)

    toggleSelection.handler(
      new KeyboardEvent("keydown", { key: "X", metaKey: true, shiftKey: true })
    )

    expect(mockPush).not.toHaveBeenCalled()
    expect(mockState.toggleSelectionMode).toHaveBeenCalledWith()
  })

  it("不再注册容易冲突的选择模式快捷键", () => {
    mockState.isSelectionMode = true
    renderAppShortcuts()

    expect(shortcutRegistrations.some((item) => item.id === "app.selection.selectAll")).toBe(false)
    expect(shortcutRegistrations.some((item) => item.id === "app.selection.clear")).toBe(false)
  })
})
