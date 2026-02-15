import { getMemos, getArchivedMemos } from "@/actions/fetchMemos";
import { Memo } from "@/types/memo";
import { cookies } from 'next/headers';
import { MainLayoutClient } from "@/components/layout/MainLayoutClient";

export default async function MemoPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();

  const query = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const cookieCode = cookieStore.get('memo_access_code')?.value;
  const urlCode = typeof searchParams?.code === 'string' ? searchParams.code : undefined;
  const adminCode = urlCode || cookieCode;

  const yearStr = typeof searchParams?.year === 'string' ? searchParams.year : undefined;
  const monthStr = typeof searchParams?.month === 'string' ? searchParams.month : undefined;
  const tagStr = typeof searchParams?.tag === 'string' ? searchParams.tag : undefined;
  const dateStr = typeof searchParams?.date === 'string' ? searchParams.date : undefined;
  const sortStr = typeof searchParams?.sort === 'string' ? searchParams.sort : 'newest';

  let memos: Memo[] = [];
  if (yearStr && monthStr) {
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    if (!isNaN(year) && !isNaN(month)) {
      memos = (await getArchivedMemos(year, month)) || [];
    }
  } else {
    memos = (await getMemos({ limit: 20, query, adminCode, tag: tagStr, date: dateStr, sort: sortStr })) || [];
  }

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
    />
  );
}
