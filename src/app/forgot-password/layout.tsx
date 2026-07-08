import type { Metadata } from "next"
import { noIndexRobots } from "@/shared/lib/page-metadata"

export const metadata: Metadata = {
  title: "找回密码 - JustMemo",
  robots: noIndexRobots,
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
