import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
} from "node:crypto"
import { getAdminClient } from "@/lib/supabase"
import { env } from "@/lib/env"

export const CLI_DEVICE_EXPIRY_MS = 10 * 60 * 1000
const DEVICE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function hashDeviceCode(code: string) {
  return createHash("sha256").update(code).digest("hex")
}

function tokenKey() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("CLI 授权加密密钥未配置")
  return createHash("sha256").update(env.SUPABASE_SERVICE_ROLE_KEY).digest()
}

export function encryptDeviceToken(value: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".")
}

export function decryptDeviceToken(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split(".")
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("CLI 授权令牌格式无效")
  }
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(), Buffer.from(ivValue, "base64url"))
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"))
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8")
}

export function createDeviceCode() {
  return Array.from(
    { length: 6 },
    () => DEVICE_CODE_ALPHABET[randomInt(0, DEVICE_CODE_ALPHABET.length)]
  ).join("")
}

export async function createDeviceSession() {
  const code = createDeviceCode()
  const requestId = randomUUID()
  const expiresAt = new Date(Date.now() + CLI_DEVICE_EXPIRY_MS).toISOString()
  const { error } = await getAdminClient()
    .from("cli_device_sessions")
    .insert({
      id: requestId,
      code_hash: hashDeviceCode(code),
      expires_at: expiresAt,
    })

  if (error) throw new Error("无法创建 CLI 授权请求")

  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "https://just-memo.vercel.app"

  return {
    requestId,
    code,
    expiresAt,
    authorizeUrl: `${siteUrl}/cli/authorize?request=${requestId}`,
  }
}
