import type { Metadata } from "next"
import { GalleryPageContent } from "@/features/gallery"

export const metadata: Metadata = {
  title: "画廊 - JustMemo",
}

export default async function GalleryPage() {
  return <GalleryPageContent />
}
