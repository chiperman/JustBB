"use client"

import { useEffect, useMemo, useState } from "react"
import {
  formatLogin,
  formatPublish,
  formatSearch,
  formatShow,
  formatWhoami,
} from "../../../../cli/src/output"
import type { MemoSummary } from "../../../../cli/src/types"

type DemoStep = {
  label: string
  command: string
  lines: string[]
  typingSpeed: number
  outputMode?: "instant" | "progressive"
}

const demoMemo: MemoSummary = {
  id: "demo-memo-042",
  memo_number: 42,
  content: "今天去了上海",
  tags: ["旅行"],
  created_at: "2026-07-11T00:00:00.000Z",
  is_locked: false,
  images: [],
}

const lifeMemo: MemoSummary = {
  ...demoMemo,
  id: "demo-memo-037",
  memo_number: 37,
  content: "在陌生城市醒来",
  created_at: "2026-07-10T00:00:00.000Z",
  tags: ["生活"],
}

const unlockedPrivateMemo: MemoSummary = {
  ...demoMemo,
  id: "demo-memo-017",
  memo_number: 17,
  content: "把今天留给自己，慢慢走回熟悉的街道。",
  tags: ["私密"],
  is_locked: false,
}

const DEMO_AUTHORIZE_URL =
  "https://just-memo.vercel.app/cli/authorize？equest=5e6f1***-d***-4***-a***-31e7f842s***"
const PASSWORD_PROMPTS = ["请输入解锁口令：", "访问口令：", "再次输入访问口令："] as const
const DEMO_HELP_LINES = [
  "JustMemo CLI",
  "用法：",
  "  justmemo login",
  "  justmemo logout",
  "  justmemo whoami",
  "  justmemo publish [正文...] …",
  "  justmemo search [关键词...] …",
  "更多参数：justmemo help",
]

export function buildDemoSteps(authorizeUrl: string): DemoStep[] {
  return [
    {
      label: "01 / help",
      command: "$ justmemo help",
      lines: DEMO_HELP_LINES,
      typingSpeed: 58,
      outputMode: "instant",
    },
    {
      label: "02 / login",
      command: "$ justmemo login",
      lines: formatLogin({ authorizeUrl, code: "A7K2P9", browserOpened: true }).split("\n"),
      typingSpeed: 126,
    },
    {
      label: "03 / whoami",
      command: "$ justmemo whoami",
      lines: formatWhoami("cli-manual@example.com", "member").split("\n"),
      typingSpeed: 84,
    },
    {
      label: "04 / publish",
      command: "$ justmemo publish 今天的记录 #日记",
      lines: formatPublish(42).split("\n"),
      typingSpeed: 78,
    },
    {
      label: "05 / private publish",
      command: "$ justmemo publish --private --pin 周末的秘密",
      lines: [
        "口令提示（可留空）：旅行记录",
        "访问口令：********",
        "再次输入访问口令：********",
        "口令已确认。",
        ...formatPublish(43).split("\n"),
      ],
      typingSpeed: 68,
    },
    {
      label: "06 / search",
      command: "$ justmemo search 旅行 --tag 生活",
      lines: formatSearch([demoMemo, lifeMemo]).split("\n"),
      typingSpeed: 72,
      outputMode: "instant",
    },
    {
      label: "07 / filtered search",
      command: "$ justmemo search --tag 生活 --limit 5",
      lines: formatSearch([lifeMemo]).split("\n"),
      typingSpeed: 64,
      outputMode: "instant",
    },
    {
      label: "08 / show",
      command: "$ justmemo show 42",
      lines: formatShow(demoMemo).split("\n"),
      typingSpeed: 76,
    },
    {
      label: "09 / unlock",
      command: "$ justmemo show 17 --unlock",
      lines: [
        "口令提示：旅行记录",
        "请输入解锁口令：********",
        ...formatShow(unlockedPrivateMemo).split("\n"),
      ],
      typingSpeed: 72,
    },
    {
      label: "10 / logout",
      command: "$ justmemo logout",
      lines: ["justmemo logout success"],
      typingSpeed: 82,
    },
  ]
}

export function TerminalUsageDemo() {
  const [stepIndex, setStepIndex] = useState(0)
  const [commandText, setCommandText] = useState("")
  const [lineIndex, setLineIndex] = useState(0)
  const [lineText, setLineText] = useState("")
  const [phase, setPhase] = useState<"command" | "lines">("command")
  const [isPaused, setIsPaused] = useState(false)
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const demoSteps = useMemo(() => buildDemoSteps(DEMO_AUTHORIZE_URL), [])
  const step = demoSteps[stepIndex]

  useEffect(() => {
    if (isPaused) return

    if (phase === "command") {
      if (commandText.length < step.command.length) {
        const timer = window.setTimeout(
          () => setCommandText(step.command.slice(0, commandText.length + 1)),
          reducedMotion ? 0 : step.typingSpeed
        )
        return () => window.clearTimeout(timer)
      }

      const timer = window.setTimeout(() => setPhase("lines"), reducedMotion ? 0 : 260)
      return () => window.clearTimeout(timer)
    }

    if (lineIndex < step.lines.length) {
      if (step.outputMode === "instant") {
        const timer = window.setTimeout(
          () => {
            setLineIndex(step.lines.length)
            setLineText("")
          },
          reducedMotion ? 0 : 140
        )
        return () => window.clearTimeout(timer)
      }

      const line = step.lines[lineIndex]
      const passwordPrompt = PASSWORD_PROMPTS.find((prompt) => line.startsWith(prompt))

      if (line.length === 0 && lineText.length === 0) {
        const timer = window.setTimeout(
          () => setLineIndex((current) => current + 1),
          reducedMotion ? 0 : 220
        )
        return () => window.clearTimeout(timer)
      }

      if (lineText.length === 0) {
        const initialText = passwordPrompt ?? line
        const timer = window.setTimeout(() => setLineText(initialText), reducedMotion ? 0 : 180)
        return () => window.clearTimeout(timer)
      }

      if (passwordPrompt && lineText.length < line.length) {
        const timer = window.setTimeout(
          () => setLineText(line.slice(0, lineText.length + 1)),
          reducedMotion ? 0 : 95
        )
        return () => window.clearTimeout(timer)
      }

      if (lineText.length === line.length) {
        const timer = window.setTimeout(
          () => {
            setLineIndex((current) => current + 1)
            setLineText("")
          },
          reducedMotion ? 0 : line.length === 0 ? 220 : 650
        )
        return () => window.clearTimeout(timer)
      }
    }

    const timer = window.setTimeout(
      () => {
        setStepIndex((current) => (current + 1) % demoSteps.length)
        setCommandText("")
        setLineIndex(0)
        setLineText("")
        setPhase("command")
      },
      reducedMotion ? 900 : 4800
    )
    return () => window.clearTimeout(timer)
  }, [
    commandText.length,
    demoSteps.length,
    isPaused,
    lineIndex,
    lineText.length,
    phase,
    reducedMotion,
    step,
  ])

  const completedLines = step.lines.slice(0, lineIndex)
  const activeLine = step.lines[lineIndex]
  const activePasswordPrompt = activeLine
    ? PASSWORD_PROMPTS.find((prompt) => activeLine.startsWith(prompt))
    : undefined
  const showCommandCursor = phase === "command" && commandText.length > 0

  return (
    <section
      className="mt-8 max-w-[600px]"
      aria-label="JustMemo CLI usage preview"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-[#a8a49d]">
        <span>Real CLI output</span>
        <span className="text-[#e08767]">{isPaused ? "paused" : "live demo"}</span>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-white/10 bg-[#191918] shadow-[0_18px_55px_rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
          <i className="size-1.5 rounded-full bg-[#e08767]" />
          <i className="size-1.5 rounded-full bg-[#77736c]" />
          <i className="size-1.5 rounded-full bg-[#77736c]" />
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-[#77736c]">
            zsh / justmemo
          </span>
        </div>
        <div
          data-terminal-body
          className="h-[250px] overflow-hidden px-4 py-5 font-mono text-xs leading-6 sm:px-5"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="break-all text-[#e08767]">
              {commandText}
              <span
                className="cli-typing-cursor"
                aria-hidden="true"
                style={showCommandCursor ? undefined : { opacity: 0, animation: "none" }}
              />
              <span className="ml-3 text-[10px] uppercase tracking-[0.15em] text-[#77736c]">
                {step.label}
              </span>
            </span>
          </div>
          <div className="mt-3 break-words text-[#a8a49d]">
            {completedLines.map((line, index) => (
              <DemoLine key={`${line}-${index}`} text={line} />
            ))}
            {activeLine !== undefined && (
              <DemoLine
                active
                text={lineText}
                showCursor={
                  Boolean(activePasswordPrompt) &&
                  lineText.length > 0 &&
                  lineText.length < activeLine.length
                }
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function DemoLine({
  text,
  active = false,
  showCursor = false,
}: {
  text: string
  active?: boolean
  showCursor?: boolean
}) {
  return (
    <div className={`text-[#a8a49d] ${active ? "cli-demo-line-enter" : ""}`}>
      {text || "\u00a0"}
      {showCursor && <span className="cli-typing-cursor" aria-hidden="true" />}
    </div>
  )
}
