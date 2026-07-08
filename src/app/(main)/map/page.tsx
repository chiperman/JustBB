import type { Metadata } from "next"
import { MapPageContent } from "@/features/map"

export const metadata: Metadata = {
  title: "地图 - JustMemo",
}

export default function MapPage() {
  return <MapPageContent />
}
