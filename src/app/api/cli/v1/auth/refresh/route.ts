import { NextResponse } from "next/server"
import { getCliAuthClient } from "@/server/services/cli/client"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "请求体必须是 JSON" },
      { status: 400 }
    )
  }

  const refreshToken =
    typeof body === "object" && body !== null && "refresh_token" in body
      ? (body as { refresh_token?: unknown }).refresh_token
      : undefined

  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    return NextResponse.json(
      { success: false, data: null, error: "缺少 refresh_token" },
      { status: 400 }
    )
  }

  const { data, error } = await getCliAuthClient().auth.refreshSession({
    refresh_token: refreshToken,
  })
  if (error || !data.session) {
    return NextResponse.json(
      { success: false, data: null, error: "登录已失效，请重新登录" },
      { status: 401 }
    )
  }

  const { data: userData, error: userError } = await getCliAuthClient().auth.getUser(
    data.session.access_token
  )
  if (userError || userData.user?.app_metadata?.role !== "admin") {
    return NextResponse.json(
      { success: false, data: null, error: "CLI access is restricted to administrators." },
      { status: 403 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
    error: null,
  })
}
