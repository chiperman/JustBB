// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDelayedLoadingVisibility } from "./useDelayedLoadingVisibility"

const LOADING_REVEAL_DELAY_MS = 150
const LOADING_MIN_VISIBLE_MS = 250

describe("useDelayedLoadingVisibility", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("does not reveal loading UI for a fast request", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ loading }) => useDelayedLoadingVisibility(loading), {
      initialProps: { loading: true },
    })

    act(() => vi.advanceTimersByTime(LOADING_REVEAL_DELAY_MS - 1))
    rerender({ loading: false })
    act(() => vi.runAllTimers())

    expect(result.current).toBe(false)
  })

  it("keeps a revealed skeleton visible long enough to avoid flashing", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ loading }) => useDelayedLoadingVisibility(loading), {
      initialProps: { loading: true },
    })

    act(() => vi.advanceTimersByTime(LOADING_REVEAL_DELAY_MS))
    expect(result.current).toBe(true)

    rerender({ loading: false })
    act(() => vi.advanceTimersByTime(LOADING_MIN_VISIBLE_MS - 1))
    expect(result.current).toBe(true)

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(false)
  })
})
