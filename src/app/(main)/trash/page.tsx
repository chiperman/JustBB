import type { Metadata } from "next"
import { isAuthenticated } from "@/features/auth/actions"
import { redirect } from "next/navigation"
import { TrashClient } from "@/features/trash"

export const metadata: Metadata = {
  title: "回收站 - JustMemo",
}

export default async function TrashPage() {
  if (!(await isAuthenticated())) {
    redirect("/")
  }

  return <TrashClient />
}
