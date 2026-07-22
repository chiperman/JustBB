import type { Metadata } from "next"
import { TagsPageContent } from "@/features/tags"

export const metadata: Metadata = {
  title: "标签 - JustMemo",
}

export default function TagsPage() {
  return <TagsPageContent />
}
