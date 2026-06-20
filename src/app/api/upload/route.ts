import { NextRequest, NextResponse } from "next/server"
import { getClient } from "@/lib/supabase"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 10

// Magic bytes: [signature] -> { ext, type }
const MAGIC_BYTES: Record<string, { ext: string; type: string }> = {
  // JPEG: FF D8 FF
  ffd8ff: { ext: "jpg", type: "image/jpeg" },
  // PNG: 89 50 4E 47
  "89504e47": { ext: "png", type: "image/png" },
  // GIF87a: 47 49 46 38 37 61 / GIF89a: 47 49 46 38 39 61
  "474946383761": { ext: "gif", type: "image/gif" },
  "474946383961": { ext: "gif", type: "image/gif" },
  // WebP: 52 49 46 46 __ __ __ __ 57 45 42 50
  "52494646": { ext: "webp", type: "image/webp" },
}

function validateMagicBytes(buffer: Buffer): { ext: string; type: string } | null {
  if (buffer.length < 4) return null

  const hex = buffer.toString("hex").slice(0, 14)

  for (const [magic, info] of Object.entries(MAGIC_BYTES)) {
    if (hex.startsWith(magic)) return info
  }

  return null
}

const uploadTimestamps = new Map<string, number[]>()

const r2ClientMap = new Map<string, S3Client>()

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

export function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const timestamps = uploadTimestamps.get(userId) ?? []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    uploadTimestamps.set(userId, recent)
    return false
  }
  recent.push(now)
  uploadTimestamps.set(userId, recent)
  return true
}

async function isPublicImageReachable(url: string): Promise<boolean> {
  try {
    const headResponse = await fetch(url, { method: "HEAD", cache: "no-store" })
    if (headResponse.ok) return true

    // 有些对象存储或代理不支持 HEAD，用最小 GET 兜底确认公开读权限。
    const getResponse = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
    })
    return getResponse.ok
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const supabase = await getClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  // 读取用户的 R2 配置
  const { data: config } = await supabase
    .from("r2_configs")
    .select("account_id, access_key_id, secret_access_key, bucket_name, public_url")
    .eq("user_id", user.id)
    .single()

  if (!config) {
    return NextResponse.json({ error: "未配置 R2，请先在设置中配置" }, { status: 400 })
  }

  // 解析上传的文件
  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "未选择文件" }, { status: 400 })
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "上传过于频繁" }, { status: 429 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "不支持的文件类型，请上传 JPG/PNG/GIF/WebP" },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const magicInfo = validateMagicBytes(buffer)

  if (!magicInfo) {
    return NextResponse.json({ error: "文件内容不是有效的图片" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "文件大小不能超过 10MB" }, { status: 400 })
  }

  // 生成文件路径
  const ext = magicInfo.ext
  const finalContentType = magicInfo.type
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const key = `JustMemo/${user.id}/${timestamp}-${random}.${ext}`

  // 上传到 R2
  const client = getR2Client(config.account_id, config.access_key_id, config.secret_access_key)

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket_name,
        Key: key,
        Body: buffer,
        ContentType: finalContentType,
      })
    )
  } catch (err) {
    const isDev = process.env.NODE_ENV === "development"
    const message = err instanceof Error ? err.message : "上传失败"
    return NextResponse.json({ error: isDev ? message : "上传失败，请稍后重试" }, { status: 500 })
  }

  const publicUrl = config.public_url.replace(/\/+$/, "")
  const url = `${publicUrl}/${key}`

  const reachable = await isPublicImageReachable(url)
  if (!reachable) {
    return NextResponse.json({
      url,
      warning:
        "图片已上传，但公开访问 URL 暂时无法读取。Memo 已继续发布，请检查 R2 Bucket 公开访问或公开访问 URL 配置。",
    })
  }

  return NextResponse.json({ url })
}
