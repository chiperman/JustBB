import type { Metadata } from "next"
import { isAdmin } from "@/features/auth/actions"
import { redirect } from "next/navigation"
import { TrashClient } from "@/features/trash"

export const metadata: Metadata = {
  title: "回收站 - JustMemo",
}

export default async function TrashPage() {
  if (!(await isAdmin())) {
    redirect("/unauthorized")
  }

  return <TrashClient />
}
