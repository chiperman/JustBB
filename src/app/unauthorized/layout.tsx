import type { Metadata } from "next"
import { noIndexRobots } from "@/shared/lib/page-metadata"

export const metadata: Metadata = {
  title: "无权访问 - JustMemo",
  robots: noIndexRobots,
}

export default function UnauthorizedLayout({ children }: { children: React.ReactNode }) {
  return children
}
