"use server"

import { getCurrentUser, isAdmin } from "@/features/auth/actions"
import { getAdminClient } from "@/lib/supabase"
import { env } from "@/lib/env"
import { ActionResponse } from "../shared/types"

const FREE_PLAN_LIMITS = {
  dbMb: 500,
  storageMb: 1024,
  mau: 50000,
  egressGb: 5,
  realtimePeakConnections: 200,
  realtimeMessages: 2_000_000,
  functionInvocations: 500_000,
} as const

const MANAGEMENT_API_TIMEOUT_MS = 5000
const FALLBACK_TIMEOUT_MS = 8000

interface UsageMetric {
  used: number
  limit: number
  percentage: number
  unit: string
}

interface SupabaseUsageData {
  db: UsageMetric
  storage: UsageMetric
  mau: UsageMetric
  egress: UsageMetric
  realtime: {
    connections: number
    messages: number
  }
  functions: {
    invocations: number
  }
}

export interface SupabaseUsageResult extends ActionResponse<SupabaseUsageData> {
  isFullIndicator: boolean
  sourceMode: "management_api" | "fallback"
  managementApiConfigured: boolean
}

const bytesToMb = (bytes: number) => Number((bytes / (1024 * 1024)).toFixed(2))
const bytesToGb = (bytes: number) =>
  Number((bytes / (1024 * 1024 * 1024)).toFixed(2))
const clampPercentage = (used: number, limit: number) => {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) {
    return 0
  }

  return Math.min(Number(((used / limit) * 100).toFixed(1)), 100)
}

const buildMetric = (
  used: number,
  limit: number,
  unit: string
): UsageMetric => ({
  used,
  limit,
  percentage: clampPercentage(used, limit),
  unit,
})

const emptyUsageData = (): SupabaseUsageData => ({
  db: buildMetric(0, FREE_PLAN_LIMITS.dbMb, "MB"),
  storage: buildMetric(0, FREE_PLAN_LIMITS.storageMb, "MB"),
  mau: buildMetric(0, FREE_PLAN_LIMITS.mau, ""),
  egress: buildMetric(0, FREE_PLAN_LIMITS.egressGb, "GB"),
  realtime: {
    connections: 0,
    messages: 0,
  },
  functions: {
    invocations: 0,
  },
})

interface RpcCapableAdminClient {
  rpc: (fn: string) => Promise<{ data: unknown; error: unknown }>
}

interface StorageObjectRecord {
  metadata?: {
    size?: number
  } | null
}

interface StorageSchemaCapableAdminClient {
  schema: (schema: string) => {
    from: (table: string) => {
      select: (columns: string) => Promise<{
        data: StorageObjectRecord[] | null
        error: unknown
      }>
    }
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

async function fetchManagementUsage(
  projectRef: string,
  apiKey: string
): Promise<SupabaseUsageData | null> {
  try {
    const response = await withTimeout(
      fetch(`https://api.supabase.com/v1/projects/${projectRef}/usage`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
      }),
      MANAGEMENT_API_TIMEOUT_MS,
      "Supabase Management API 请求超时"
    )

    if (!response.ok) {
      console.warn("[Usage] Supabase Management API returned:", response.status)
      return null
    }

    const usage = await response.json()
    const dbUsedBytes = Number(usage?.db_size?.usage ?? 0)
    const storageUsedBytes = Number(usage?.storage_size?.usage ?? 0)
    const mauUsed = Number(usage?.monthly_active_users?.usage ?? 0)
    const egressUsedBytes =
      Number(usage?.db_egress?.usage ?? 0) +
      Number(usage?.storage_egress?.usage ?? 0)

    return {
      db: buildMetric(bytesToMb(dbUsedBytes), FREE_PLAN_LIMITS.dbMb, "MB"),
      storage: buildMetric(
        bytesToMb(storageUsedBytes),
        FREE_PLAN_LIMITS.storageMb,
        "MB"
      ),
      mau: buildMetric(mauUsed, FREE_PLAN_LIMITS.mau, ""),
      egress: buildMetric(
        bytesToGb(egressUsedBytes),
        FREE_PLAN_LIMITS.egressGb,
        "GB"
      ),
      realtime: {
        connections: Number(usage?.realtime_peak_connections?.usage ?? 0),
        messages: Number(usage?.realtime_message_count?.usage ?? 0),
      },
      functions: {
        invocations: Number(usage?.func_invocations?.usage ?? 0),
      },
    }
  } catch (error) {
    console.warn("[Usage] Supabase Management API fetch failed:", error)
    return null
  }
}

async function getDatabaseUsageMb() {
  const supabase = getAdminClient()
  const rpcResult = await (supabase as unknown as RpcCapableAdminClient).rpc(
    "get_database_size"
  )

  if (!rpcResult?.error && typeof rpcResult?.data === "number") {
    return bytesToMb(rpcResult.data)
  }

  // Fallback: 使用 pg_total_relation_size 只查表元数据，避免全表扫描
  try {
    const { data, error } = (await (
      supabase as unknown as RpcCapableAdminClient
    ).rpc("run_sql", {
      sql: "SELECT pg_total_relation_size('public.memos') / 1024 / 1024",
    })) as unknown as { data: number | null; error: unknown }
    if (error || typeof data !== "number") {
      console.warn("[Usage] pg_total_relation_size fallback failed")
      return 0
    }
    return data
  } catch (error) {
    console.warn("[Usage] Database size fallback failed:", error)
    return 0
  }
}

async function getStorageUsageMb() {
  try {
    const supabase =
      getAdminClient() as unknown as StorageSchemaCapableAdminClient
    const { data, error } = await supabase
      .schema("storage")
      .from("objects")
      .select("metadata")

    if (error || !Array.isArray(data)) {
      console.warn("[Usage] Storage usage fallback failed:", error)
      return 0
    }

    const totalBytes = data.reduce((total: number, object) => {
      return total + Number(object?.metadata?.size ?? 0)
    }, 0)

    return bytesToMb(totalBytes)
  } catch (error) {
    console.warn("[Usage] Storage usage fallback threw:", error)
    return 0
  }
}

async function getUserCount() {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    })

    if (error) {
      console.warn("[Usage] User count fallback failed:", error)
      return 0
    }

    return Number(data?.total ?? data?.users?.length ?? 0)
  } catch (error) {
    console.warn("[Usage] User count fallback threw:", error)
    return 0
  }
}

async function buildFallbackUsageData(): Promise<SupabaseUsageData> {
  const [dbUsedMb, storageUsedMb, userCount] = await Promise.all([
    getDatabaseUsageMb(),
    getStorageUsageMb(),
    getUserCount(),
  ])

  return {
    db: buildMetric(dbUsedMb, FREE_PLAN_LIMITS.dbMb, "MB"),
    storage: buildMetric(storageUsedMb, FREE_PLAN_LIMITS.storageMb, "MB"),
    mau: buildMetric(userCount, FREE_PLAN_LIMITS.mau, ""),
    egress: buildMetric(0, FREE_PLAN_LIMITS.egressGb, "GB"),
    realtime: {
      connections: 0,
      messages: 0,
    },
    functions: {
      invocations: 0,
    },
  }
}

export async function getSupabaseUsageStats(): Promise<SupabaseUsageResult> {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return {
      success: false,
      error: "未登录，无法查看服务用量",
      data: emptyUsageData(),
      isFullIndicator: false,
      sourceMode: "fallback",
      managementApiConfigured: false,
    }
  }

  if (!(await isAdmin())) {
    return {
      success: false,
      error: "权限不足",
      data: emptyUsageData(),
      isFullIndicator: false,
      sourceMode: "fallback",
      managementApiConfigured: false,
    }
  }

  const projectRef = env.SUPABASE_PROJECT_REF
  const managementApiKey = env.SUPABASE_MANAGEMENT_API_KEY
  const managementApiConfigured = Boolean(projectRef && managementApiKey)

  if (projectRef && managementApiKey) {
    const managementData = await fetchManagementUsage(
      projectRef,
      managementApiKey
    )

    if (managementData) {
      return {
        success: true,
        error: null,
        data: managementData,
        isFullIndicator: true,
        sourceMode: "management_api",
        managementApiConfigured: true,
      }
    }
  }

  try {
    const fallbackData = await withTimeout(
      buildFallbackUsageData(),
      FALLBACK_TIMEOUT_MS,
      "基础用量查询超时"
    )

    return {
      success: true,
      error: null,
      data: fallbackData,
      isFullIndicator: false,
      sourceMode: "fallback",
      managementApiConfigured,
    }
  } catch (error) {
    console.error("[Usage] Fallback usage collection failed:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "获取 Supabase 用量失败",
      data: emptyUsageData(),
      isFullIndicator: false,
      sourceMode: "fallback",
      managementApiConfigured,
    }
  }
}
