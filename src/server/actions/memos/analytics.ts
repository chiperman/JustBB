"use server"
import { getClient } from "@/lib/supabase"
import { TimelineStats, HeatmapStats } from "@/types/stats"
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
export async function getAllTags(): Promise<ActionResponse<{ tag_name: string; count: number }[]>> {
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
export async function getTimelineStats(): Promise<ActionResponse<TimelineStats>> {
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
