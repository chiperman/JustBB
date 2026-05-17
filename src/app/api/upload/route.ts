import { NextRequest, NextResponse } from "next/server"
import { getClient } from "@/lib/supabase"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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
    .select(
      "account_id, access_key_id, secret_access_key, bucket_name, public_url"
    )
    .eq("user_id", user.id)
    .single()

  if (!config) {
    return NextResponse.json(
      { error: "未配置 R2，请先在设置中配置" },
      { status: 400 }
    )
  }

  // 解析上传的文件
  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "未选择文件" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "不支持的文件类型，请上传 JPG/PNG/GIF/WebP" },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "文件大小不能超过 10MB" },
      { status: 400 }
    )
  }

  // 生成文件路径
  const ext = file.name.split(".").pop() || "png"
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const username = user.email?.split("@")[0] || user.id
  const key = `JustMemo/${username}/${timestamp}-${random}.${ext}`

  // 上传到 R2
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.account_id}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.access_key_id,
      secretAccessKey: config.secret_access_key,
    },
  })

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket_name,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "上传失败"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const publicUrl = config.public_url.replace(/\/+$/, "")
  const url = `${publicUrl}/${key}`

  return NextResponse.json({ url })
}
