import { NextRequest, NextResponse } from "next/server"
import { getPosterImageSource } from "@/features/memos/lib/share-poster"
import { getMemosQuery, MemoFilters } from "@/lib/memos/query-builder"
import { fetchPosterImage } from "@/server/services/share-poster-image"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const memoId = request.nextUrl.searchParams.get("memoId")
  if (!memoId) return NextResponse.json({ error: "缺少 Memo 标识" }, { status: 400 })

  const { query: queryBuilder } = await getMemosQuery()
  const { data: memo, error } = await MemoFilters.publicOnly(MemoFilters.active(queryBuilder))
    .eq("id", memoId)
    .single()

  if (error || !memo) return new NextResponse(null, { status: 404 })

  const imageSource = getPosterImageSource({
    content: memo.content,
    images: Array.isArray(memo.images)
      ? memo.images.filter((value: unknown): value is string => typeof value === "string")
      : [],
  })
  if (!imageSource) return new NextResponse(null, { status: 404 })

  const image = await fetchPosterImage(imageSource)
  if (!image) {
    return NextResponse.json({ error: "海报图片暂时无法读取" }, { status: 422 })
  }

  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
