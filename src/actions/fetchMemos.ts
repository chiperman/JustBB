"use server";

import { createClient } from "@/utils/supabase/server";
import { Json } from "@/types/database";
import { Memo } from "@/types/memo";

export async function getMemos(params: {
  query?: string;
  adminCode?: string;
  limit?: number;
  offset?: number;
  tag?: string;
  date?: string;
  sort?: string;
  after_date?: string; // 游标：在此日期之后
  before_date?: string; // 游标：在此日期之前（含）
}) {
  const {
    query = "",
    adminCode = "",
    limit: limitSize = 20,
    offset: offsetVal = 0,
    tag = null,
    date = null,
    sort = "newest",
    after_date = null,
    before_date = null,
  } = params;

  const supabase = await createClient();
  const filters: Record<string, unknown> = tag ? { tag } : {};

  // 逻辑修正：如果存在游标（向上或向下滚动），则不应应用 calendar date 的强等过滤
  // 否则数据流会被限制在同一天内
  if (date && !before_date && !after_date) {
    filters.date = date;
  }

  if (after_date) filters.after_date = after_date;
  if (before_date) filters.before_date = before_date;

  const { data, error } = await supabase.rpc("search_memos_secure", {
    query_text: query,
    input_code: adminCode,
    limit_val: limitSize,
    offset_val: offsetVal,
    filters: filters as unknown as Json,
    sort_order: sort,
  });

  if (error) {
    console.error("Error fetching memos via RPC:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return [];
  }

  return data as unknown as Memo[];
}

/**
 * 获取指定时间维度（年、月、日）的日记内容，并探测实际存在日记的真实上一个/下一个时间节点
 * 驱动 Calendar Contextual Pager 模式
 */
export async function getContextMemosWithNeighbors(params: {
  targetDate: string; // YYYY-MM-DD
  type: "year" | "month" | "day";
  adminCode?: string;
  tag?: string;
  query?: string;
}) {
  const { targetDate, type, adminCode = "", tag, query } = params;

  const [yearStr, monthStr, dayStr] = targetDate.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  let startIso = "";
  let endIso = "";

  if (type === "year") {
    startIso = `${year}-01-01T00:00:00.000+08:00`;
    endIso = `${year}-12-31T23:59:59.999+08:00`;
  } else if (type === "month") {
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    startIso = `${year}-${monthStr}-01T00:00:00.000+08:00`;
    endIso = `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, "0")}T23:59:59.999+08:00`;
  } else {
    startIso = `${targetDate}T00:00:00.000+08:00`;
    endIso = `${targetDate}T23:59:59.999+08:00`;
  }

  // 1. 获取当期数据 (最多 20 条，便于内部下拉加载)
  // 减去 1 毫秒作为 after_date，因为 RPC 里是 `> after_date`
  const prevTime = new Date(new Date(startIso).getTime() - 1).toISOString();

  const contextMemos = await getMemos({
    query,
    adminCode,
    tag,
    limit: 20,
    after_date: prevTime,
    before_date: new Date(endIso).toISOString(),
    sort: "newest",
  });

  const supabase = await createClient();
  const canViewPrivate = adminCode === process.env.ADMIN_CODE;

  // 2. 探测过去的最近一条实际存在数据的日记记录时间 (Prev Neighbor)
  let prevQuery = supabase
    .from("memos")
    .select("created_at")
    .is("deleted_at", null)
    .lt("created_at", new Date(startIso).toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (!canViewPrivate) prevQuery = prevQuery.eq("is_private", false);
  if (tag) prevQuery = prevQuery.contains("tags", [tag]);

  // 3. 探测未来的最近一条实际存在数据的日记记录时间 (Next Neighbor)
  let nextQuery = supabase
    .from("memos")
    .select("created_at")
    .is("deleted_at", null)
    .gt("created_at", new Date(endIso).toISOString())
    .order("created_at", { ascending: true })
    .limit(1);

  if (!canViewPrivate) nextQuery = nextQuery.eq("is_private", false);
  if (tag) nextQuery = nextQuery.contains("tags", [tag]);

  const [prevRes, nextRes] = await Promise.all([prevQuery, nextQuery]);

  // 将探测到的真实时间点，格式化为能够再次传送（对应维度）的 Date 字符串
  const formatToDimensionStr = (timestamp?: string) => {
    if (!timestamp) return null;
    const d = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const oDay = parts.find((p) => p.type === "day")?.value;

    if (type === "year") {
      return `${y}-01-01`; // 传送回该年的 1月1日
    } else if (type === "month") {
      return `${y}-${m}-01`; // 传送回该月的 1日
    }
    return `${y}-${m}-${oDay}`;
  };

  const prevDate =
    prevRes.data && prevRes.data.length > 0
      ? formatToDimensionStr(prevRes.data[0].created_at)
      : null;
  const nextDate =
    nextRes.data && nextRes.data.length > 0
      ? formatToDimensionStr(nextRes.data[0].created_at)
      : null;

  return {
    memos: contextMemos,
    prevDate,
    nextDate,
  };
}

export async function getArchivedMemos(
  year: number,
  month: number,
  limit: number = 20,
  offset: number = 0,
) {
  const supabase = await createClient();
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("is_private", false)
    .is("deleted_at", null)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching archived memos:", error);
    return [];
  }

  return data as unknown as Memo[];
}

export async function getGalleryMemos(limit: number = 20, offset: number = 0) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("is_private", false)
    .is("deleted_at", null)
    .ilike("content", "%![%](%)%")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching gallery memos:", error);
    return [];
  }

  return data as unknown as Memo[];
}
