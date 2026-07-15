import { NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase"
import { decryptDeviceToken, hashDeviceCode } from "@/server/services/cli/device"

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

  const admin = getAdminClient()
  const { data: device, error } = await admin
    .from("cli_device_sessions")
    .select("id, status, expires_at, access_token, refresh_token")
    .eq("id", requestId)
    .eq("code_hash", hashDeviceCode(code))
    .maybeSingle()

  if (error || !device) {
    return NextResponse.json(
      { success: false, data: null, error: "授权请求不存在" },
      { status: 404 }
    )
  }

  if (device.status === "pending" && new Date(device.expires_at).getTime() <= Date.now()) {
    await admin.from("cli_device_sessions").update({ status: "expired" }).eq("id", requestId)
    return NextResponse.json({ success: false, data: null, error: "授权码已过期" }, { status: 410 })
  }

  if (device.status === "pending") {
    return NextResponse.json({
      success: true,
      data: { status: "pending", expires_at: device.expires_at },
      error: null,
    })
  }

  if (device.status === "denied") {
    return NextResponse.json(
      { success: false, data: null, error: "CLI access is restricted to administrators." },
      { status: 403 }
    )
  }

  if (device.status !== "approved" || !device.access_token || !device.refresh_token) {
    return NextResponse.json(
      { success: false, data: null, error: "授权请求不可用" },
      { status: 409 }
    )
  }

  const { data: consumed } = await admin
    .from("cli_device_sessions")
    .update({ status: "consumed", consumed_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "approved")
    .select("access_token, refresh_token")
    .maybeSingle()

  if (!consumed?.access_token || !consumed.refresh_token) {
    return NextResponse.json(
      { success: false, data: null, error: "授权请求已被领取" },
      { status: 409 }
    )
  }

  try {
    return NextResponse.json({
      success: true,
      data: {
        status: "approved",
        access_token: decryptDeviceToken(consumed.access_token),
        refresh_token: decryptDeviceToken(consumed.refresh_token),
      },
      error: null,
    })
  } catch (decryptError) {
    console.error("CLI device token decryption failed:", decryptError)
    return NextResponse.json({ success: false, data: null, error: "授权令牌无效" }, { status: 500 })
  }
}
