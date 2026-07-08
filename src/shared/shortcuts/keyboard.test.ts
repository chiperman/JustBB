/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest"

import {
  getNextSequenceState,
  isBrowserReservedShortcut,
  isInteractiveShortcutTarget,
  normalizeKeyboardEvent,
  parseKeyStroke,
  parseShortcutBinding,
  sequenceMatch,
  shortcutMatchesEvent,
  shouldHandleShortcutEvent,
} from "./keyboard"

function keyboardEvent(key: string, init: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    altKey: init.altKey,
    ctrlKey: init.ctrlKey,
    metaKey: init.metaKey,
    shiftKey: init.shiftKey,
  })
}

describe("keyboard shortcut helpers", () => {
  it("标准化单键、Shift 单键和命名键", () => {
    expect(normalizeKeyboardEvent(keyboardEvent("?"))).toMatchObject({
      key: "?",
      shift: false,
    })
    expect(normalizeKeyboardEvent(keyboardEvent("A", { shiftKey: true }))).toMatchObject({
      key: "a",
      shift: true,
    })
    expect(normalizeKeyboardEvent(keyboardEvent("Escape"))).toMatchObject({
      key: "escape",
    })
  })

  it("解析单键、组合键和序列键绑定", () => {
    expect(parseKeyStroke("Shift+A")).toMatchObject({
      key: "a",
      shift: true,
    })
    expect(parseKeyStroke("mod+enter")).toMatchObject({
      key: "enter",
      ctrl: true,
      meta: true,
    })
    expect(parseShortcutBinding("g h").sequence.map((stroke) => stroke.key)).toEqual(["g", "h"])
  })

  it("支持跨平台 mod 组合键", () => {
    expect(
      shortcutMatchesEvent("mod+?", keyboardEvent("?", { metaKey: true, shiftKey: true }))
    ).toBe(true)
    expect(
      shortcutMatchesEvent("mod+?", keyboardEvent("?", { ctrlKey: true, shiftKey: true }))
    ).toBe(true)
    expect(shortcutMatchesEvent("mod+enter", keyboardEvent("Enter", { metaKey: true }))).toBe(true)
    expect(
      shortcutMatchesEvent("mod+shift+x", keyboardEvent("X", { ctrlKey: true, shiftKey: true }))
    ).toBe(true)
  })

  it("匹配第一阶段需要的 Command/Ctrl 单主键快捷键", () => {
    expect(shortcutMatchesEvent("mod+k", keyboardEvent("k", { metaKey: true }))).toBe(true)
    expect(shortcutMatchesEvent("mod+/", keyboardEvent("/", { metaKey: true }))).toBe(true)
    expect(shortcutMatchesEvent("mod+enter", keyboardEvent("Enter", { metaKey: true }))).toBe(true)
    expect(shortcutMatchesEvent("mod+arrowup", keyboardEvent("ArrowUp", { metaKey: true }))).toBe(
      true
    )
    expect(
      shortcutMatchesEvent("mod+shift+x", keyboardEvent("X", { ctrlKey: true, shiftKey: true }))
    ).toBe(true)
    expect(shortcutMatchesEvent("mod+k", keyboardEvent("k"))).toBe(false)
  })

  it("匹配 g 前缀序列键", () => {
    const sequence = parseShortcutBinding("g m")
    const first = getNextSequenceState(null, normalizeKeyboardEvent(keyboardEvent("g")), 1000, 900)
    const second = getNextSequenceState(
      first,
      normalizeKeyboardEvent(keyboardEvent("m")),
      1200,
      900
    )

    expect(sequenceMatch(first.keys, sequence)).toBe("partial")
    expect(sequenceMatch(second.keys, sequence)).toBe("matched")
  })

  it("序列键超时后从当前按键重新开始", () => {
    const first = getNextSequenceState(null, normalizeKeyboardEvent(keyboardEvent("g")), 1000, 900)
    const second = getNextSequenceState(
      first,
      normalizeKeyboardEvent(keyboardEvent("m")),
      2200,
      900
    )

    expect(second.keys.map((stroke) => stroke.key)).toEqual(["m"])
  })

  it("默认保护输入、编辑器、弹窗和菜单目标", () => {
    document.body.innerHTML = `
      <input id="input" />
      <textarea id="textarea"></textarea>
      <select id="select"></select>
      <div id="editor" contenteditable="true"></div>
      <div role="dialog"><button id="dialog-button">ok</button></div>
      <div role="menu"><button id="menu-button">item</button></div>
      <div role="combobox"><span id="combo-option">item</span></div>
      <button id="plain">plain</button>
    `

    expect(isInteractiveShortcutTarget(document.getElementById("input"))).toBe(true)
    expect(isInteractiveShortcutTarget(document.getElementById("textarea"))).toBe(true)
    expect(isInteractiveShortcutTarget(document.getElementById("select"))).toBe(true)
    expect(isInteractiveShortcutTarget(document.getElementById("editor"))).toBe(true)
    expect(isInteractiveShortcutTarget(document.getElementById("dialog-button"))).toBe(true)
    expect(isInteractiveShortcutTarget(document.getElementById("menu-button"))).toBe(true)
    expect(isInteractiveShortcutTarget(document.getElementById("combo-option"))).toBe(true)
    expect(isInteractiveShortcutTarget(document.getElementById("plain"))).toBe(true)
  })

  it("允许显式放开交互目标保护", () => {
    document.body.innerHTML = `<input id="input" />`
    const input = document.getElementById("input")

    expect(
      shouldHandleShortcutEvent(
        { key: "/", altKey: false, ctrlKey: false, metaKey: false, target: input },
        { allowInInteractiveTarget: false }
      )
    ).toBe(false)
    expect(
      shouldHandleShortcutEvent(
        { key: "/", altKey: false, ctrlKey: false, metaKey: false, target: input },
        { allowInInteractiveTarget: true }
      )
    ).toBe(true)
  })

  it("不覆盖常见浏览器组合键", () => {
    expect(isBrowserReservedShortcut(keyboardEvent("r", { metaKey: true }))).toBe(true)
    expect(isBrowserReservedShortcut(keyboardEvent("l", { ctrlKey: true }))).toBe(true)
    expect(isBrowserReservedShortcut(keyboardEvent("s", { metaKey: true }))).toBe(true)
    expect(isBrowserReservedShortcut(keyboardEvent("n"))).toBe(false)
  })

  it("允许明确声明的应用快捷键接管保留组合键", () => {
    const event = keyboardEvent("a", { metaKey: true })

    expect(
      shouldHandleShortcutEvent(
        { key: "a", altKey: false, ctrlKey: false, metaKey: true, target: document.body },
        { allowBrowserReservedShortcut: false, allowInInteractiveTarget: false }
      )
    ).toBe(false)
    expect(
      shouldHandleShortcutEvent(
        {
          key: event.key,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          target: document.body,
        },
        { allowBrowserReservedShortcut: true, allowInInteractiveTarget: false }
      )
    ).toBe(true)
  })
})
