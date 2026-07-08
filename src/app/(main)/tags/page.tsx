import type { Metadata } from "next"
import { getAllTags } from "@/server/actions/memos/analytics"
import { TagsPageContent } from "@/features/tags"

export const metadata: Metadata = {
  title: "标签 - JustMemo",
}

export default async function TagsPage() {
  const res = await getAllTags()
  const tags = res.success ? res.data || [] : []

  return <TagsPageContent tags={tags} />
}
