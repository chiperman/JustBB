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
