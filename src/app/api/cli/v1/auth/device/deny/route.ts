import { NextResponse } from "next/server"
import { getAdminClient, getClient } from "@/lib/supabase"

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

  const requestId =
    typeof body === "object" && body !== null && "request_id" in body
      ? (body as { request_id?: unknown }).request_id
      : undefined
  if (typeof requestId !== "string") {
    return NextResponse.json(
      { success: false, data: null, error: "授权请求参数不完整" },
      { status: 400 }
    )
  }

  const { data: userData } = await (await getClient()).auth.getUser()
  if (!userData.user) {
    return NextResponse.json(
      { success: false, data: null, error: "请先登录 JustMemo" },
      { status: 401 }
    )
  }
  if (userData.user.app_metadata?.role === "admin") {
    return NextResponse.json(
      { success: false, data: null, error: "管理员不能拒绝 CLI 授权请求" },
      { status: 403 }
    )
  }

  const { error } = await getAdminClient()
    .from("cli_device_sessions")
    .update({ status: "denied" })
    .eq("id", requestId)
    .eq("status", "pending")

  if (error) {
    return NextResponse.json({ success: false, data: null, error: "拒绝授权失败" }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { status: "denied" }, error: null })
}
