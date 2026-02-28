import { getMemos, getArchivedMemos, getMemosContext } from "@/actions/fetchMemos";
import { Memo } from "@/types/memo";
import { cookies } from 'next/headers';
import { MainLayoutClient } from "@/components/layout/MainLayoutClient";
import { isAdmin as checkIsAdmin } from "@/actions/auth";

export default async function MemoPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();

  const query = Array.isArray(searchParams?.q) ? searchParams.q[0] : (typeof searchParams?.q === 'string' ? searchParams.q : undefined);
  const cookieCode = cookieStore.get('memo_access_code')?.value;
  const urlCode = Array.isArray(searchParams?.code) ? searchParams.code[0] : (typeof searchParams?.code === 'string' ? searchParams.code : undefined);
  const adminCode = urlCode || cookieCode;

  const yearStr = Array.isArray(searchParams?.year) ? searchParams.year[0] : (typeof searchParams?.year === 'string' ? searchParams.year : undefined);
  const monthStr = Array.isArray(searchParams?.month) ? searchParams.month[0] : (typeof searchParams?.month === 'string' ? searchParams.month : undefined);
  const tagStr = Array.isArray(searchParams?.tag) ? searchParams.tag[0] : (typeof searchParams?.tag === 'string' ? searchParams.tag : undefined);
  // 额外确保 dateStr 至少是一个非空字符串，否则不触发过滤
  let dateStr = Array.isArray(searchParams?.date) ? searchParams.date[0] : (typeof searchParams?.date === 'string' ? searchParams.date : undefined);
  if (dateStr === '') dateStr = undefined;

  const sortStr = Array.isArray(searchParams?.sort) ? searchParams.sort[0] : (typeof searchParams?.sort === 'string' ? searchParams.sort : 'newest');

  // 同时获取 Memos 和管理权限（并行执行）
  const [memosResult, isAdmin] = await Promise.all([
    (async () => {
      // 核心重构：如果指定了具体日期，作为硬过滤 (Hard filter)，只查这一天的数据
      if (dateStr) {
        return (await getMemos({ limit: 50, query, adminCode, tag: tagStr, date: dateStr, sort: sortStr })) || [];
      }

      if (yearStr && monthStr) {
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        if (!isNaN(year) && !isNaN(month)) {
          return (await getArchivedMemos(year, month)) || [];
        }
        return [];
      } else {
        return (await getMemos({ limit: 20, query, adminCode, tag: tagStr, date: dateStr, sort: sortStr })) || [];
      }
    })(),
    checkIsAdmin()
  ]);

  const memos = memosResult as Memo[];

  const flattenedSearchParams = {
    query: Array.isArray(searchParams?.q) ? searchParams.q[0] : searchParams?.q,
    tag: Array.isArray(searchParams?.tag) ? searchParams.tag[0] : searchParams?.tag,
    year: Array.isArray(searchParams?.year) ? searchParams.year[0] : searchParams?.year,
    month: Array.isArray(searchParams?.month) ? searchParams.month[0] : searchParams?.month,
    date: Array.isArray(searchParams?.date) ? searchParams.date[0] : searchParams?.date,
    code: Array.isArray(searchParams?.code) ? searchParams.code[0] : searchParams?.code,
    sort: sortStr
  };

  return (
    <MainLayoutClient
      memos={memos}
      searchParams={flattenedSearchParams}
      adminCode={adminCode}
      initialIsAdmin={isAdmin}
    />
  );
}
