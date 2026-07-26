import { useCallback } from "react"
import type { Memo } from "@/types/memo"
import { useMemoSync, type MemoEventPayload } from "@/lib/memos/events"

export type MemoDerivedDomain =
  | "cache"
  | "stats"
  | "tags"
  | "map"
  | "daily"
  | "timeline"
  | "on-this-day"

type MemoField = keyof Memo

const UPDATE_FIELDS: Record<MemoDerivedDomain, ReadonlySet<MemoField>> = {
  cache: new Set([
    "content",
    "tags",
    "word_count",
    "created_at",
    "deleted_at",
    "images",
    "image_metadata",
    "locations",
    "is_private",
    "is_pinned",
    "pinned_at",
  ]),
  stats: new Set(["content", "word_count", "created_at", "deleted_at", "is_private"]),
  tags: new Set(["content", "tags", "deleted_at", "is_private"]),
  map: new Set(["content", "locations", "deleted_at", "is_private"]),
  daily: new Set([
    "content",
    "tags",
    "created_at",
    "deleted_at",
    "images",
    "image_metadata",
    "is_private",
  ]),
  timeline: new Set(["created_at", "deleted_at", "is_private"]),
  "on-this-day": new Set([
    "content",
    "tags",
    "created_at",
    "deleted_at",
    "images",
    "image_metadata",
    "is_private",
  ]),
}

export function shouldRefreshMemoDomain(event: MemoEventPayload, domain: MemoDerivedDomain) {
  if (event.type !== "update") return true
  const fields = UPDATE_FIELDS[domain]
  return Object.keys(event.updates).some((field) => fields.has(field as MemoField))
}

export function useMemoDerivedRefresh(
  domain: MemoDerivedDomain,
  refresh: () => void | Promise<void>
) {
  useMemoSync(
    useCallback(
      (event) => {
        if (shouldRefreshMemoDomain(event, domain)) void refresh()
      },
      [domain, refresh]
    )
  )
}
