"use client"

import { type FormEvent, type ReactNode, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { login } from "@/features/auth/actions"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

type Props = {
  requestId: string
  initialCode: string
  userEmail: string | null
}

const DEVICE_CODE_PATTERN = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g

export function CliAuthorizePanel({ requestId, initialCode, userEmail }: Props) {
  const router = useRouter()
  const [code, setCode] = useState(initialCode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPending(true)
    setError(null)
    const result = await login(new FormData(event.currentTarget))
    if (result.success) {
      setIsPending(false)
      router.refresh()
    } else {
      setError(
        result.error && /[\u3400-\u9fff]/u.test(result.error)
          ? result.error
          : "登录失败，请稍后重试。"
      )
      setIsPending(false)
    }
  }

  const handleApprove = async () => {
    setIsPending(true)
    setError(null)
    const response = await fetch("/api/cli/v1/auth/device/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ request_id: requestId, code }),
    })
    const result = (await response.json()) as { success: boolean; error: string | null }
    if (!response.ok || !result.success) {
      setError(
        result.error && /[\u3400-\u9fff]/u.test(result.error)
          ? result.error
          : "授权失败，请重新确认授权码。"
      )
      setIsPending(false)
      return
    }
    setApproved(true)
    setIsPending(false)
  }

  if (!requestId) return <CliGuide />

  if (!userEmail) {
    return (
      <Card eyebrow="步骤 01 / 登录" title="先在浏览器确认你的身份">
        <p className="mb-7 text-sm leading-7 text-[#b3aea7]">
          登录后，CLI 会沿用你的 JustMemo 权限。普通用户只能浏览；管理员可以发布和管理自己的 Memo。
        </p>
        <form onSubmit={handleLogin} className="space-y-5">
          <label className="block space-y-2 text-sm font-medium" htmlFor="cli-email">
            <span>邮箱</span>
            <Input
              id="cli-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              className="h-11 border-white/15 bg-[#252421] text-[#f3f1ee] placeholder:text-[#8f8a83]"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium" htmlFor="cli-password">
            <span>密码</span>
            <Input
              id="cli-password"
              name="password"
              type="password"
              placeholder="输入你的密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="h-11 border-white/15 bg-[#252421] text-[#f3f1ee] placeholder:text-[#8f8a83]"
            />
          </label>
          {error && (
            <p className="text-sm leading-6 text-[#ff9478]" role="alert">
              {error}
            </p>
          )}
          <Button
            className="h-11 w-full bg-[#e08767] text-[#10100f] hover:bg-[#ef9b7d] active:scale-95"
            disabled={isPending}
          >
            {isPending ? "正在确认身份..." : "登录并继续"}
          </Button>
        </form>
      </Card>
    )
  }

  if (approved) {
    return (
      <Card eyebrow="设备已确认" title="回到终端继续即可">
        <div className="flex items-start gap-3 border-t border-white/10 pt-5">
          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e08767] text-[11px] font-bold text-[#10100f]">
            ✓
          </span>
          <p className="text-sm leading-7 text-[#b3aea7]">回到终端即可，CLI 会自动完成登录。</p>
        </div>
      </Card>
    )
  }

  return (
    <Card eyebrow="步骤 02 / 确认设备" title="输入授权码，然后回到终端">
      <p className="mb-6 text-sm leading-7 text-[#b3aea7]">
        你正在授权 <span className="font-medium text-[#f3f1ee]">{userEmail}</span> 使用 JustMemo
        CLI。
      </p>
      <label
        className="mb-2 block text-xs font-mono uppercase tracking-[0.16em] text-[#b3aea7]"
        htmlFor="device-code"
      >
        终端授权码
      </label>
      <div className="group relative mb-3 rounded-xl focus-within:ring-2 focus-within:ring-[#e08767]/30">
        <div className="grid grid-cols-6 gap-2" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => {
            const digit = code[index]
            const isCurrent = index === code.length

            return (
              <div
                key={index}
                className={`flex h-16 items-center justify-center rounded-lg border font-mono text-2xl tabular-nums transition-[border-color,background-color,color] sm:h-[68px] sm:text-3xl ${
                  digit
                    ? "border-[#e08767]/60 bg-[#e08767]/10 text-[#e08767]"
                    : isCurrent
                      ? "border-[#e08767]/50 bg-[#252421] text-[#f3f1ee]"
                      : "border-white/15 bg-[#252421] text-[#f3f1ee]"
                }`}
              >
                {digit || ""}
              </div>
            )
          })}
        </div>
        <Input
          id="device-code"
          inputMode="text"
          maxLength={6}
          value={code}
          onChange={(event) =>
            setCode(event.target.value.toUpperCase().replace(DEVICE_CODE_PATTERN, "").slice(0, 6))
          }
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby="device-code-help"
          aria-label="六位授权码"
          aria-invalid={Boolean(error)}
          className="absolute inset-0 h-full w-full cursor-text border-0 bg-transparent text-transparent opacity-0 shadow-none caret-transparent focus-visible:ring-0"
        />
      </div>
      <p id="device-code-help" className="mb-6 text-xs leading-6 text-[#b3aea7]">
        授权码只能使用一次，十分钟后失效。
      </p>
      {error && (
        <p className="mb-3 text-sm leading-6 text-[#ff9478]" role="alert">
          {error}
        </p>
      )}
      <Button
        className="h-11 w-full bg-[#e08767] text-[#10100f] hover:bg-[#ef9b7d] active:scale-95"
        disabled={isPending || code.length !== 6}
        onClick={handleApprove}
      >
        {isPending ? "正在授权..." : "确认授权"}
      </Button>
    </Card>
  )
}

function CliGuide() {
  return (
    <Card eyebrow="CLI / READY TO RUN" title="从命令行开始">
      <p className="mb-6 text-sm leading-7 text-[#b3aea7]">
        浏览器只负责确认身份，日常操作都在终端完成。
      </p>
      <div className="mt-7 border-t border-white/10 pt-5">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#b3aea7]">
          常用命令
        </p>
        <div className="grid gap-3">
          <GuideCommand command="justmemo login" detail="登录授权" />
          <GuideCommand command="justmemo publish ..." detail="发布记录" />
          <GuideCommand command="justmemo search" detail="搜索记录" />
          <GuideCommand command="justmemo edit 123" detail="编辑记录" />
          <GuideCommand command="justmemo trash" detail="管理回收站" />
        </div>
      </div>
      <Link
        href="/cli/commands"
        className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-[#f3f1ee] transition-colors hover:text-[#e08767]"
      >
        查看完整命令
        <span aria-hidden="true">→</span>
      </Link>
    </Card>
  )
}

function GuideCommand({ command, detail }: { command: string; detail: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <code className="min-w-0 break-all font-mono text-xs text-[#f3f1ee]">{command}</code>
      <span className="shrink-0 text-right text-xs text-[#b3aea7]">{detail}</span>
    </div>
  )
}

function Card({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="mx-auto w-full max-w-[600px] rounded-[16px] border border-white/10 bg-[#191918] p-5 text-[#f3f1ee] sm:p-7">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-white/10 pb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#e08767]">JustMemo</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#b3aea7]">
          {eyebrow}
        </p>
      </div>
      <h2 className="mb-5 text-balance text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-[28px]">
        {title}
      </h2>
      {children}
    </section>
  )
}
