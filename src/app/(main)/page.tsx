import { getMemos, getArchivedMemos } from "@/actions/memos/query";
import { Memo } from "@/types/memo";
import { cookies } from 'next/headers';
import { MainLayoutClient } from "@/components/layout/MainLayoutClient";
import { isAdmin as checkIsAdmin } from "@/actions/auth";
import { getSingleParam, generateCacheKey } from "@/lib/utils";

export default async function MemoPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = (await props.searchParams) || {};
  const cookieStore = await cookies();

  const query = getSingleParam(searchParams.q);
  const cookieCode = cookieStore.get('memo_access_code')?.value;
  const urlCode = getSingleParam(searchParams.code);
  const adminCode = urlCode || cookieCode;

  const yearStr = getSingleParam(searchParams.year);
  const monthStr = getSingleParam(searchParams.month);
  const tagStr = getSingleParam(searchParams.tag);
  const numStr = getSingleParam(searchParams.num);
  const dateStr = getSingleParam(searchParams.date);
  const sortStr = getSingleParam(searchParams.sort) || 'newest';

  // 同时获取 Memos 和管理权限（并行执行）
  const [memosResult, isAdmin] = await Promise.all([
    (async () => {
      // 核心重构：如果指定了具体日期，作为硬过滤 (Hard filter)，只查这一天的数据
      if (dateStr) {
        return await getMemos({ limit: 20, query, adminCode, tag: tagStr, num: numStr, date: dateStr, sort: sortStr === 'oldest' ? 'oldest' : 'newest' });
      }

      if (yearStr && monthStr) {
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        if (!isNaN(year) && !isNaN(month)) {
          return await getArchivedMemos(year, month);
        }
        return { success: true, data: [] as Memo[], error: null };
      } else {
        return await getMemos({ limit: 20, query, adminCode, tag: tagStr, num: numStr, date: dateStr, sort: sortStr === 'oldest' ? 'oldest' : 'newest' });
      }
    })(),
    checkIsAdmin()
  ]);

  const memos = (memosResult.success ? memosResult.data : []) as Memo[];

  const flattenedSearchParams = {
    query,
    tag: tagStr,
    num: numStr,
    year: yearStr,
    month: monthStr,
    date: dateStr,
    code: urlCode,
    sort: sortStr === 'oldest' ? 'oldest' : 'newest'
  };

  const cacheKey = generateCacheKey(flattenedSearchParams);

  return (
    <MainLayoutClient
      key={cacheKey}
      memos={memos}
      searchParams={flattenedSearchParams}
      adminCode={adminCode}
      initialIsAdmin={isAdmin}
    />
  );
}
