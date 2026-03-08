import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 确定性日期格式化工具。
 * 使用 date-fns 替代原生的 toLocaleString，确保 SSR 和 Client 端输出完全一致，
 * 彻底消除 Hydration 错误且无需 ESLint 魔法注释。
 */
export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd HH:mm') {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: zhCN });
}

/**
 * 获取单个搜索参数值的安全工具函数
 */
export function getSingleParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  if (typeof param === 'string') return param === '' ? undefined : param;
  return undefined;
}

/**
 * 根据搜索参数生成唯一的缓存键
 */
export function generateCacheKey(params: Record<string, string | string[] | undefined>): string {
  const searchParams = new URLSearchParams();
  const keys = ['q', 'tag', 'num', 'year', 'month', 'date', 'sort'];

  keys.forEach(key => {
    const val = getSingleParam(params[key === 'q' ? 'query' : key] ?? params[key]);
    if (val) searchParams.set(key, val);
  });

  const queryStr = searchParams.toString();
  return queryStr ? `/?${queryStr}` : "/";
}
