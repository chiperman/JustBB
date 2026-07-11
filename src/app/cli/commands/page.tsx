import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "JustMemo CLI 命令参考",
  robots: { index: false, follow: false },
}

const BROWSE_COMMANDS = [
  "justmemo help",
  "justmemo search [keywords...] [--tag tag] [--num number] [--limit count] [--page page] [--json]",
  "justmemo show <number> [--unlock] [--json]",
]

const ACCOUNT_COMMANDS = ["justmemo login", "justmemo whoami", "justmemo logout"]

const ADMIN_COMMANDS = [
  "justmemo publish [content...] [--private] [--pin] [--json]",
  "justmemo edit <number> [--json]",
  "justmemo show <number> [--edit|--pin|--unpin|--private|--public|--delete] [--json]",
  "justmemo trash [<number>] [--restore|--purge|--empty] [--yes] [--limit count] [--page page] [--json]",
]

export default function CliCommandsPage() {
  return (
    <main className="min-h-screen bg-[#10100f] text-[#f4f1eb]">
      <div className="mx-auto min-h-screen max-w-[1320px] px-5 py-4 sm:px-8 sm:py-5 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            href="/cli/authorize"
            className="flex items-center gap-2.5 text-[#f4f1eb] hover:text-[#e08767]"
          >
            <span className="size-2.5 rounded-[3px] bg-[#e08767]" />
            <span className="font-mono text-xs font-semibold tracking-[0.16em]">JUSTMEMO</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#a8a49d]">
            CLI COMMANDS
          </span>
        </header>

        <div className="mx-auto max-w-[600px]">
          <section className="py-12 sm:py-16">
            <p className="font-mono text-[11px] tracking-[0.2em] text-[#e08767]">命令参考</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              JustMemo CLI
            </h1>
            <p className="mt-5 max-w-[540px] text-[15px] leading-7 text-[#b3aea7]">
              未登录或普通用户只能浏览公开内容；管理员可以发布、编辑和管理自己的 Memo。
            </p>
          </section>

          <div className="space-y-6 pb-12">
            <CommandCard
              eyebrow="GUEST / STANDARD USER"
              title="浏览公开 Memo"
              description="无需登录。普通用户登录后仍只有浏览权限；私密 Memo 可逐条输入访问口令解锁。"
              commands={BROWSE_COMMANDS}
            />
            <CommandCard
              eyebrow="SIGNED-IN ACCOUNT"
              title="登录与设备会话"
              description="CLI 会先显示授权链接和授权码；按下 Enter 后才会打开浏览器。"
              commands={ACCOUNT_COMMANDS}
            />
            <CommandCard
              eyebrow="ADMINISTRATOR"
              title="发布并管理自己的 Memo"
              description="仅管理员可用。发布私密 Memo 或将 Memo 改为私密时，需要两次输入访问口令。"
              commands={ADMIN_COMMANDS}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function CommandCard({
  eyebrow,
  title,
  description,
  commands,
}: {
  eyebrow: string
  title: string
  description: string
  commands: string[]
}) {
  return (
    <section className="w-full rounded-[16px] border border-white/10 bg-[#191918] p-5 sm:p-7">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#e08767]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em]">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-[#b3aea7]">{description}</p>
      <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
        {commands.map((command) => (
          <code
            key={command}
            className="block break-all font-mono text-xs leading-6 text-[#f3f1ee]"
          >
            {command}
          </code>
        ))}
      </div>
    </section>
  )
}
