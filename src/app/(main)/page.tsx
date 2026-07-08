import type { Metadata } from "next"
import { MainLayoutClient } from "@/shared/layout/MainLayoutClient"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "JustMemo - 碎片化人文记录",
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <MainLayoutClient />
    </Suspense>
  )
}
