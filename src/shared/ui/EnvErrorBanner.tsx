"use client"

import * as React from "react"

/**
 * 开发环境环境变量缺失提示条
 * 仅在使用 Next.js 开发服务器时显示，生产环境自动隐藏。
 */
export function EnvErrorBanner() {
  const [show, setShow] = React.useState(false)
  const missingFields = React.useMemo((): string[] => {
    const fields: string[] = []
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
      fields.push("NEXT_PUBLIC_SUPABASE_URL")
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      fields.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    return fields
  }, [])

  React.useEffect(() => {
    if (missingFields.length > 0) {
      setShow(true)
      console.error(
        "Missing env vars:",
        missingFields.map((f) => `${f}=<required>`).join(", ")
      )
    }
  }, [missingFields])

  if (!show || missingFields.length === 0) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      <p className="font-medium">
        缺少 Supabase 环境变量配置，请检查{" "}
        <code className="mx-1 rounded bg-amber-200 px-1 py-0.5 text-xs dark:bg-amber-800">
          .env.local
        </code>{" "}
        文件。
      </p>
      <ul className="mt-1 list-disc pl-5 space-y-0.5">
        {missingFields.map((f) => (
          <li key={f}>
            <code className="font-mono text-xs opacity-80">{f}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
