import { getMemos } from "@/actions/fetchMemos";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { MemoCard } from "@/components/ui/MemoCard";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { MemoEditor } from "@/components/ui/MemoEditor";

export default async function Home(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const adminCode = typeof searchParams?.code === 'string' ? searchParams.code : undefined;
  const memos = (await getMemos({ limit: 20, query, adminCode })) || [];

  return (
    <div className="flex min-h-screen justify-center selection:bg-primary/20">
      <div className="flex w-full max-w-(--breakpoint-2xl)">
        {/* 左侧导航 */}
        <LeftSidebar />

        {/* 内容流区域 */}
        <main className="flex-1 min-w-0 bg-background px-4 md:px-8 py-10">
          <div className="max-w-2xl mx-auto space-y-10">
            {/* 顶部编辑器 */}
            <MemoEditor />

            {/* 内容列表 */}
            <div className="space-y-8">
              {memos.map((memo: any) => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
              {memos.length === 0 && <MemoCardSkeleton />}
            </div>
          </div>
        </main>

        {/* 右侧边栏 */}
        <RightSidebar />
      </div>
    </div>
  );
}
