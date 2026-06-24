import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3"
import { getClient } from "@/lib/supabase"

const r2ClientMap = new Map<string, S3Client>()

/**
 * 获取或缓存 R2 S3 客户端实例
 */
function getR2Client(accountId: string, accessKey: string, secretKey: string): S3Client {
  const cacheKey = `${accountId}:${accessKey}:${secretKey}`
  const cached = r2ClientMap.get(cacheKey)
  if (cached) return cached
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  })
  r2ClientMap.set(cacheKey, client)
  return client
}

/**
 * 从图片 URL 列表中解析出 R2 的 Key 并在 R2 存储桶中物理删除它们
 *
 * @param imageUrls 图片 URL 数组（如：https://pub-xxx.r2.dev/JustMemo/userId/12345-abc.jpg）
 * @param userId 执行删除的用户 ID
 */
export async function deleteImagesFromR2(
  imageUrls: string[],
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!imageUrls || imageUrls.length === 0) {
    return { success: true, error: null }
  }

  // 1. 提取所有有效的 key
  const keys: string[] = []
  for (const url of imageUrls) {
    // 图片 Key 格式类似 JustMemo/${userId}/${timestamp}-${random}.${ext}
    const match = url.match(/JustMemo\/.+/)
    if (match) {
      // 可能会有 URL 查询参数，如果有则去掉
      const keyWithoutQuery = match[0].split("?")[0]
      try {
        keys.push(decodeURIComponent(keyWithoutQuery))
      } catch (e) {
        console.error("Failed to decode image URL key:", keyWithoutQuery, e)
        keys.push(keyWithoutQuery)
      }
    }
  }

  if (keys.length === 0) {
    return { success: true, error: null }
  }

  try {
    const supabase = await getClient()
    // 获取用户的 R2 配置
    const { data: config, error: configError } = await supabase
      .from("r2_configs")
      .select("account_id, access_key_id, secret_access_key, bucket_name")
      .eq("user_id", userId)
      .single()

    if (configError || !config) {
      console.warn(
        "Unable to delete images from R2: User R2 config not found or error occurred.",
        configError
      )
      return { success: false, error: "未找到 R2 配置，无法删除存储桶中的文件" }
    }

    const client = getR2Client(config.account_id, config.access_key_id, config.secret_access_key)

    // S3 DeleteObjectsCommand 限制每次最多删除 1000 个 Key，执行分批删除
    const batchSize = 1000
    for (let i = 0; i < keys.length; i += batchSize) {
      const batchKeys = keys.slice(i, i + batchSize)
      await client.send(
        new DeleteObjectsCommand({
          Bucket: config.bucket_name,
          Delete: {
            Objects: batchKeys.map((key) => ({ Key: key })),
            Quiet: true,
          },
        })
      )
    }

    return { success: true, error: null }
  } catch (err) {
    console.error("Error deleting images from R2:", err)
    return { success: false, error: err instanceof Error ? err.message : "删除失败" }
  }
}
