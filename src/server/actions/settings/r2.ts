"use server"

import { getClient } from "@/lib/supabase"
import { getCurrentUserId } from "@/features/auth/actions"
import { ActionResponse } from "../shared/types"
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3"

export interface R2Config {
  account_id: string
  access_key_id: string
  secret_access_key: string
  bucket_name: string
  public_url: string
}

export async function getR2Config(): Promise<ActionResponse<R2Config>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "未登录", data: undefined }
  }

  const supabase = await getClient()
  const { data, error } = await supabase
    .from("r2_configs")
    .select(
      "account_id, access_key_id, secret_access_key, bucket_name, public_url"
    )
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") {
    return { success: false, error: error.message, data: undefined }
  }

  return { success: true, error: null, data: data ?? undefined }
}

export async function saveR2Config(config: R2Config): Promise<ActionResponse> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "未登录" }
  }

  const supabase = await getClient()
  const { error } = await supabase.from("r2_configs").upsert(
    {
      user_id: userId,
      account_id: config.account_id,
      access_key_id: config.access_key_id,
      secret_access_key: config.secret_access_key,
      bucket_name: config.bucket_name,
      public_url: config.public_url.replace(/\/+$/, ""),
    },
    { onConflict: "user_id" }
  )

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function deleteR2Config(): Promise<ActionResponse> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "未登录" }
  }

  const supabase = await getClient()
  const { error } = await supabase
    .from("r2_configs")
    .delete()
    .eq("user_id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function testR2Connection(
  config?: R2Config
): Promise<ActionResponse<string>> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { success: false, error: "未登录", data: undefined }
  }

  let testConfig = config

  if (!testConfig) {
    const supabase = await getClient()
    const { data, error } = await supabase
      .from("r2_configs")
      .select("account_id, access_key_id, secret_access_key, bucket_name")
      .eq("user_id", userId)
      .single()

    if (error || !data) {
      return { success: false, error: "未找到 R2 配置", data: undefined }
    }
    testConfig = data as R2Config
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${testConfig.account_id}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: testConfig.access_key_id,
      secretAccessKey: testConfig.secret_access_key,
    },
  })

  try {
    await client.send(new HeadBucketCommand({ Bucket: testConfig.bucket_name }))
    return { success: true, error: null, data: "连接成功" }
  } catch (err) {
    const message = simplifyR2Error(err)
    return { success: false, error: message, data: undefined }
  }
}

function simplifyR2Error(err: unknown): string {
  if (!(err instanceof Error)) return "连接失败，请检查配置是否正确"
  const msg = err.message

  if (msg.includes("InvalidAccessKeyId") || msg.includes("AccessDenied"))
    return "Access Key ID 或 Secret Access Key 不正确"
  if (msg.includes("NoSuchBucket")) return "Bucket 不存在，请检查 Bucket 名称"
  if (msg.includes("AllAccessDisabled")) return "没有该 Bucket 的访问权限"
  if (
    msg.includes("EPROTO") ||
    msg.includes("ssl3_read") ||
    msg.includes("SSL routines")
  )
    return "Account ID 不正确，无法建立安全连接"
  if (
    msg.includes("NetworkingError") ||
    msg.includes("TimeoutError") ||
    msg.includes("ECONNREFUSED")
  )
    return "网络连接失败，请检查 Account ID 是否正确"
  if (msg.includes("PermanentRedirect")) return "Account ID 不正确"

  return "连接失败，请检查配置是否正确"
}
