"use server"
import { getClient } from "@/lib/supabase"
import { TimelineStats, HeatmapStats } from "@/types/stats"
import { getCurrentUserId } from "@/features/auth/actions"
import { ActionResponse } from "../shared/types"

/**
 * 获取统计数据 (V2 - RPC 驱动)
 */
export async function getMemoStats(): Promise<ActionResponse<HeatmapStats>> {
  const supabase = await getClient()
  const { data, error } = await supabase.rpc("get_memo_stats_v2")

  if (error) {
    console.error("Error fetching memo stats:", error?.message, error)
    return {
      success: false,
      error: error?.message || "获取统计失败",
      data: {
        totalMemos: 0,
        totalTags: 0,
        firstMemoDate: null,
        days: {},
      },
    }
  }

  const stats = data as unknown as HeatmapStats
  return { success: true, error: null, data: stats }
}

/**
 * 获取所有标签及其计数
 */
export async function getAllTags(): Promise<
  ActionResponse<{ tag_name: string; count: number }[]>
> {
  const supabase = await getClient()
  const { data, error } = await supabase.rpc("get_distinct_tags")

  if (error) {
    console.error("Error fetching tags:", error.message, error)
    return { success: false, error: error.message, data: [] }
  }

  return {
    success: true,
    error: null,
    data: (data || []) as { tag_name: string; count: number }[],
  }
}

/**
 * 获取时间轴统计
 */
export async function getTimelineStats(): Promise<
  ActionResponse<TimelineStats>
> {
  const supabase = await getClient()
  const { data, error } = await supabase.rpc("get_timeline_stats", {
    include_private: true,
  })

  if (error) {
    console.error("Error fetching timeline stats:", error?.message, error)
    return {
      success: false,
      error: error?.message || "获取时间轴失败",
      data: { days: {} },
    }
  }

  return { success: true, error: null, data: data as unknown as TimelineStats }
}

/**
 * 导出笔记数据 (Markdown 或 JSON)
 */
export async function exportMemos(
  format: "markdown" | "json" = "markdown"
): Promise<ActionResponse<string>> {
  const viewerId = await getCurrentUserId()

  if (!viewerId) {
    return { success: false, error: "未登录，无法导出数据", data: "" }
  }

  const supabase = await getClient()
  const { data, error } = await supabase
    .from("memos")
    .select("content, created_at, tags")
    .is("deleted_at", null)
    .eq("owner_id", viewerId)
    .order("created_at", { ascending: false })

  if (error || !data) {
    return { success: false, error: "导出失败", data: "" }
  }

  if (format === "json") {
    return { success: true, error: null, data: JSON.stringify(data, null, 2) }
  }

  const markdown = data
    .map((m) => {
      // hydration-safe: 此函数仅在 Server Action 中执行，不参与渲染
      // eslint-disable-next-line no-restricted-syntax
      const date = new Date(m.created_at).toLocaleString()
      return `---
Date: ${date}
Tags: ${m.tags?.join(", ") || ""}
---

${m.content}

`
    })
    .join("\n\n")

  return { success: true, error: null, data: markdown }
}
