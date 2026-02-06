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

  let memos: Memo[] = [];
  if (yearStr && monthStr) {
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    if (!isNaN(year) && !isNaN(month)) {
      memos = (await getArchivedMemos(year, month)) || [];
    }
  } else {
    memos = (await getMemos({ limit: 20, query, adminCode })) || [];
  }

  return (
    <div className="space-y-10">
      {/* 顶部编辑器 */}
      <MemoEditor />

      {/* 内容列表 */}
      <div className="space-y-8">
        <MemoFeed
          initialMemos={memos ?? []}
          searchParams={{
            query: Array.isArray(searchParams?.q) ? searchParams.q[0] : searchParams?.q,
            tag: Array.isArray(searchParams?.tag) ? searchParams.tag[0] : searchParams?.tag,
            year: Array.isArray(searchParams?.year) ? searchParams.year[0] : searchParams?.year,
            month: Array.isArray(searchParams?.month) ? searchParams.month[0] : searchParams?.month,
            code: Array.isArray(searchParams?.code) ? searchParams.code[0] : searchParams?.code
          }}
          adminCode={Array.isArray(searchParams?.code) ? searchParams.code[0] : searchParams?.code}
        />
        {memos.length === 0 && <MemoCardSkeleton />}
      </div>
    </div>
  );
}
