import type { Metadata } from "next"
import { getCurrentUser } from "@/features/auth/actions"
import { TerminalUsageDemo } from "./demo"
import { CliAuthorizePanel } from "./panel"

export const metadata: Metadata = {
  title: "授权 JustMemo CLI",
  robots: { index: false, follow: false },
}

export default async function CliAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string; code?: string }>
}) {
  const params = await searchParams
  const user = await getCurrentUser()
  const hasRequest = Boolean(params.request)

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[#10100f] text-[#f4f1eb]"
      aria-labelledby="authorize-page-title"
    >
      <div className="mx-auto flex min-h-screen max-w-[1320px] flex-col px-5 py-4 sm:px-8 sm:py-5 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <BrandMark />
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.17em] text-[#a8a49d]">
            <span className="size-1.5 rounded-full bg-[#e08767] cli-breathe" />
            Live handshake
          </span>
        </header>

        <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-8 py-6 lg:items-center lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:gap-10 lg:py-8 xl:gap-16">
          <section className="mx-auto w-full min-w-0 max-w-[600px] lg:mx-0">
            <h1
              id="authorize-page-title"
              className="max-w-none whitespace-nowrap font-mono text-[clamp(1.5rem,4vw,4.7rem)] font-medium leading-[1.03] tracking-[-0.065em]"
            >
              {hasRequest ? "先确认，再让终端继续。" : "命令行可以做更多。"}
            </h1>
            <p className="mt-5 max-w-[500px] text-pretty text-[15px] leading-7 text-[#a8a49d]">
              {hasRequest
                ? "确认授权后，终端会自动继续。下面是它接下来可以完成的事情。"
                : "从登录开始，然后搜索、查看和管理你的记录。下面是一个简短的使用预览。"}
            </p>
            <TerminalUsageDemo />
          </section>
          <section className="w-full">
            <CliAuthorizePanel
              requestId={params.request || ""}
              initialCode={params.code || ""}
              userEmail={user?.email || null}
            />
          </section>
        </div>

        <FooterNote />
      </div>
    </main>
  )
}

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 text-[#f4f1eb]">
      <span className="size-2.5 rounded-[3px] bg-[#e08767]" />
      <span className="font-mono text-xs font-semibold tracking-[0.16em]">JUSTMEMO</span>
    </div>
  )
}

function FooterNote() {
  return (
    <footer className="flex flex-col gap-2 border-t border-white/10 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#a8a49d]/70 sm:flex-row sm:items-center sm:justify-between">
      <span>CLI access</span>
      <span>No password in terminal · Browser confirms identity</span>
    </footer>
  )
}
