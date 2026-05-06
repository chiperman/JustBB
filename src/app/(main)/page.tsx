import { MainLayoutClient } from "@/shared/layout/MainLayoutClient"
import { Suspense } from "react"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <MainLayoutClient />
    </Suspense>
  )
}
