import { createDeviceSession } from "@/server/services/cli/device"
import { CLI_ERROR_CODES, cliError, cliOk } from "@/server/services/cli/http"

export async function POST() {
  try {
    const session = await createDeviceSession()
    return cliOk({
      request_id: session.requestId,
      code: session.code,
      expires_at: session.expiresAt,
      authorize_url: session.authorizeUrl,
    })
  } catch (error) {
    console.error("CLI device session creation failed:", error)
    return cliError("无法创建 CLI 授权请求", 500, CLI_ERROR_CODES.INTERNAL)
  }
}
