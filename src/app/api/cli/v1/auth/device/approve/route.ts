import { NextResponse } from "next/server"
import { getClient, getAdminClient } from "@/lib/supabase"
import { encryptDeviceToken, hashDeviceCode } from "@/server/services/cli/device"

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
  const code =
    typeof body === "object" && body !== null && "code" in body
      ? (body as { code?: unknown }).code
      : undefined

  if (typeof requestId !== "string" || typeof code !== "string") {
    return NextResponse.json(
      { success: false, data: null, error: "授权请求参数不完整" },
      { status: 400 }
    )
  }

  const supabase = await getClient()
  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ])

  if (!userData.user || !sessionData.session) {
    return NextResponse.json(
      { success: false, data: null, error: "请先登录 JustMemo" },
      { status: 401 }
    )
  }

  const admin = getAdminClient()
  const { data: device, error: lookupError } = await admin
    .from("cli_device_sessions")
    .select("id, status, expires_at")
    .eq("id", requestId)
    .eq("code_hash", hashDeviceCode(code))
    .maybeSingle()

  if (lookupError || !device) {
    return NextResponse.json({ success: false, data: null, error: "授权码无效" }, { status: 400 })
  }
  if (device.status !== "pending" || new Date(device.expires_at).getTime() <= Date.now()) {
    return NextResponse.json(
      { success: false, data: null, error: "授权码已过期或已使用" },
      { status: 400 }
    )
  }

  const { error } = await admin
    .from("cli_device_sessions")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: userData.user.id,
      access_token: encryptDeviceToken(sessionData.session.access_token),
      refresh_token: encryptDeviceToken(sessionData.session.refresh_token),
    })
    .eq("id", requestId)
    .eq("status", "pending")

  if (error) {
    return NextResponse.json({ success: false, data: null, error: "授权失败" }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { status: "approved" }, error: null })
}
