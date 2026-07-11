import { NextResponse } from "next/server"
import { getCliClient } from "@/server/services/cli/client"

export async function GET(request: Request) {
  const { data, error } = await getCliClient(request).auth.getUser()
  if (error || !data.user) {
    return NextResponse.json({ success: false, data: null, error: "未登录" }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    data: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.app_metadata?.role || "user",
    },
    error: null,
  })
}
