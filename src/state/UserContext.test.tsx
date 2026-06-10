// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"
import { UserProvider, useUser } from "./UserContext"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

function TestConsumer() {
  const { user, loading, isAdmin } = useUser()
  return (
    <div>
      <span data-testid="user">{user?.email ?? "none"}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
    </div>
  )
}

describe("UserContext", () => {
  it("无 initialUser 时显示 none", async () => {
    const { supabase } = await import("@/lib/supabase")
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    })

    render(<UserProvider>{<TestConsumer />}</UserProvider>)

    expect(screen.getByTestId("user").textContent).toBe("none")
  })

  it("有 initialUser 时显示用户信息", async () => {
    render(
      <UserProvider initialUser={{ id: "u1", email: "a@b.com", created_at: "", role: "user" }}>
        <TestConsumer />
      </UserProvider>
    )

    expect(screen.getByTestId("user").textContent).toBe("a@b.com")
  })
})
