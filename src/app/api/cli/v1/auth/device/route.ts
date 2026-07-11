import { NextResponse } from "next/server"
import { createDeviceSession } from "@/server/services/cli/device"

export async function POST() {
  try {
    const session = await createDeviceSession()
    return NextResponse.json({
      success: true,
      data: {
        request_id: session.requestId,
        code: session.code,
        expires_at: session.expiresAt,
        authorize_url: session.authorizeUrl,
      },
      error: null,
    })
  } catch (error) {
    console.error("CLI device session creation failed:", error)
    return NextResponse.json(
      { success: false, data: null, error: "无法创建 CLI 授权请求" },
      { status: 500 }
    )
  }
}
