"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  formatLogin,
  formatPublish,
  formatSearch,
  formatShow,
  formatWhoami,
} from "../../../../cli/src/output"
import { formatHelp } from "../../../../cli/src/commands"
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
  content: "A day in Shanghai",
  tags: ["travel"],
  created_at: "2026-07-11T00:00:00.000Z",
  is_locked: false,
  images: [],
}

const lifeMemo: MemoSummary = {
  ...demoMemo,
  id: "demo-memo-037",
  memo_number: 37,
  content: "Waking up in a new city",
  created_at: "2026-07-10T00:00:00.000Z",
  tags: ["life"],
}

const unlockedPrivateMemo: MemoSummary = {
  ...demoMemo,
  id: "demo-memo-017",
  memo_number: 17,
  content: "Keeping today to myself, one familiar street at a time.",
  tags: ["private"],
  is_locked: false,
}

const DEMO_AUTHORIZE_URL =
  "https://just-memo.vercel.app/cli/authorize?request=5e6f1e1f-d8c0-4521-a85a-31e7f842d218"
const TYPED_INPUT_PROMPTS = [
  "Access code: ",
  "Confirm access code: ",
  "Access code hint (optional): ",
] as const

function maskAuthorizeRequest(url: string) {
  return url.replace(/([?&]request=)[^&]+/, "$1***")
}

function helpPreview() {
  return [...formatHelp("admin").trimEnd().split("\n").slice(0, 6), "  …"]
}

export function buildDemoSteps(authorizeUrl: string): DemoStep[] {
  return [
    {
      label: "01 / help",
      command: "$ justmemo help",
      lines: helpPreview(),
      typingSpeed: 58,
      outputMode: "instant",
    },
    {
      label: "02 / login",
      command: "$ justmemo login",
      lines: [
        ...formatLogin({ authorizeUrl: maskAuthorizeRequest(authorizeUrl), code: "A7K2P9" }).split(
          "\n"
        ),
        "",
        "Press ENTER to open in your browser...",
        "Waiting for browser authorization...",
      ],
      typingSpeed: 126,
    },
    {
      label: "03 / whoami",
      command: "$ justmemo whoami",
      lines: formatWhoami("cli-manual@example.com", "admin").split("\n"),
      typingSpeed: 84,
    },
    {
      label: "04 / publish",
      command: "$ justmemo publish Today\'s note #journal",
      lines: formatPublish(42).split("\n"),
      typingSpeed: 78,
    },
    {
      label: "05 / private publish",
      command: "$ justmemo publish --private --pin A quiet weekend",
      lines: [
        "Access code: ********",
        "Confirm access code: ********",
        "Access code hint (optional): travel notes",
        ...formatPublish(43).split("\n"),
      ],
      typingSpeed: 68,
    },
    {
      label: "06 / search",
      command: "$ justmemo search Shanghai --tag travel",
      lines: formatSearch([demoMemo, lifeMemo]).split("\n"),
      typingSpeed: 72,
      outputMode: "instant",
    },
    {
      label: "07 / show",
      command: "$ justmemo show 42",
      lines: formatShow(demoMemo).split("\n"),
      typingSpeed: 76,
    },
    {
      label: "08 / edit",
      command: "$ justmemo edit 42",
      lines: ["Opening system editor...", "Updated Memo #42"],
      typingSpeed: 72,
    },
    {
      label: "09 / pin",
      command: "$ justmemo show 42 --pin",
      lines: ["Pinned Memo #42"],
      typingSpeed: 72,
    },
    {
      label: "10 / delete",
      command: "$ justmemo show 42 --delete",
      lines: ["Moved Memo #42 to Trash"],
      typingSpeed: 72,
    },
    {
      label: "11 / restore",
      command: "$ justmemo trash 42 --restore",
      lines: ["Restored Memo #42"],
      typingSpeed: 72,
    },
    {
      label: "12 / unlock",
      command: "$ justmemo show 17 --unlock",
      lines: [
        "Access code hint: travel notes",
        "Access code: ********",
        ...formatShow(unlockedPrivateMemo).split("\n"),
      ],
      typingSpeed: 72,
    },
    {
      label: "13 / logout",
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
  const terminalBodyRef = useRef<HTMLDivElement>(null)
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const demoSteps = useMemo(() => buildDemoSteps(DEMO_AUTHORIZE_URL), [])
  const step = demoSteps[stepIndex]

  useEffect(() => {
    terminalBodyRef.current?.scrollTo?.({ top: terminalBodyRef.current.scrollHeight })
  }, [commandText, lineIndex, lineText, phase, stepIndex])

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
      const inputPrompt = TYPED_INPUT_PROMPTS.find((prompt) => line.startsWith(prompt))

      if (line.length === 0 && lineText.length === 0) {
        const timer = window.setTimeout(
          () => setLineIndex((current) => current + 1),
          reducedMotion ? 0 : 220
        )
        return () => window.clearTimeout(timer)
      }

      if (lineText.length === 0) {
        const initialText = inputPrompt ?? line
        const timer = window.setTimeout(() => setLineText(initialText), reducedMotion ? 0 : 180)
        return () => window.clearTimeout(timer)
      }

      if (inputPrompt && lineText.length < line.length) {
        const timer = window.setTimeout(
          () => setLineText(line.slice(0, lineText.length + 1)),
          reducedMotion ? 0 : 170
        )
        return () => window.clearTimeout(timer)
      }

      if (lineText.length === line.length) {
        const timer = window.setTimeout(
          () => {
            setLineIndex((current) => current + 1)
            setLineText("")
          },
          reducedMotion ? 0 : inputPrompt ? 900 : line.length === 0 ? 220 : 650
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
  const activeInputPrompt = activeLine
    ? TYPED_INPUT_PROMPTS.find((prompt) => activeLine.startsWith(prompt))
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
      <div className="overflow-hidden rounded-[10px] border border-white/10 bg-[#191918]">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
          <i className="size-1.5 rounded-full bg-[#e08767]" />
          <i className="size-1.5 rounded-full bg-[#77736c]" />
          <i className="size-1.5 rounded-full bg-[#77736c]" />
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-[#77736c]">
            zsh / justmemo
          </span>
        </div>
        <div
          ref={terminalBodyRef}
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
            </span>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.15em] text-[#77736c]">
              {step.label}
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
                  Boolean(activeInputPrompt) &&
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
