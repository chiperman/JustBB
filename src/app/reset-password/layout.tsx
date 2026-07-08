import type { Metadata } from "next"
import { noIndexRobots } from "@/shared/lib/page-metadata"

export const metadata: Metadata = {
  title: "重置密码 - JustMemo",
  robots: noIndexRobots,
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
