import { getMemos, getArchivedMemos } from "@/actions/fetchMemos";
import { MemoEditor } from "@/components/ui/MemoEditor";
import { Memo } from "@/types/memo";
import { MemoFeed } from '@/components/ui/MemoFeed';
import { cookies } from 'next/headers';
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";

export default async function Home(props: {
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

  let memos: Memo[] = [];
  if (yearStr && monthStr) {
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    if (!isNaN(year) && !isNaN(month)) {
      memos = (await getArchivedMemos(year, month)) || [];
    }
  } else {
    memos = (await getMemos({ limit: 20, query, adminCode, tag: tagStr, date: dateStr })) || [];
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 顶部编辑器 - 固定 */}
      <div className="flex-none z-10 bg-background/95 backdrop-blur pb-4 pt-4 px-4 md:px-8 border-b border-border/40">
        <div className="max-w-4xl mx-auto w-full">
          <MemoEditor />
        </div>
      </div>

      {/* 内容列表 - 滚动 */}
      <div className="flex-1 overflow-y-auto scrollbar-hover p-4 md:px-8">
        <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
          <MemoFeed
            initialMemos={memos ?? []}
            searchParams={{
              query: Array.isArray(searchParams?.q) ? searchParams.q[0] : searchParams?.q,
              tag: Array.isArray(searchParams?.tag) ? searchParams.tag[0] : searchParams?.tag,
              year: Array.isArray(searchParams?.year) ? searchParams.year[0] : searchParams?.year,
              month: Array.isArray(searchParams?.month) ? searchParams.month[0] : searchParams?.month,
              date: Array.isArray(searchParams?.date) ? searchParams.date[0] : searchParams?.date,
              code: Array.isArray(searchParams?.code) ? searchParams.code[0] : searchParams?.code
            }}
            adminCode={Array.isArray(searchParams?.code) ? searchParams.code[0] : searchParams?.code}
          />
          {memos.length === 0 && <MemoCardSkeleton />}
        </div>
      </div>
    </div>
  );
}
