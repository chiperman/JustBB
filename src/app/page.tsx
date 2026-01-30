import { MemoCard } from "@/components/ui/MemoCard";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";

export default function Home() {
  const mockMemos = [
    {
      id: "1",
      memo_number: 124,
      content: "重构 JustMemo 的第一天。三栏布局基本搞定，衬线体配合暖白背景确实有种‘纸感’。期待接入数据后的表现。",
      tags: ["重构日志", "设计系统"],
      created_at: new Date().toISOString(),
      is_private: false,
      is_pinned: true,
      is_locked: false,
    },
    {
      id: "2",
      memo_number: 123,
      content: "这是一条测试私密内容，如果你能看到这段话，说明你有权限。如果没有权限，这段内容应该是模糊的。",
      tags: ["秘密", "测试"],
      created_at: new Date(Date.now() - 3600000).toISOString(),
      is_private: true,
      is_pinned: false,
      is_locked: true,
    }
  ];

  return (
    <div className="flex min-h-screen justify-center selection:bg-primary/20">
      <div className="flex w-full max-w-(--breakpoint-2xl)">
        {/* 左侧导航 */}
        <LeftSidebar />

        {/* 内容流区域 */}
        <main className="flex-1 min-w-0 bg-background px-4 md:px-8 py-10">
          <div className="max-w-2xl mx-auto space-y-10">
            {/* 顶部编辑器占位 */}
            <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground italic text-sm resize-none"
                placeholder="记录此刻的灵感..."
                rows={3}
              />
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-2">
                  <span className="text-xs text-muted-foreground">#标签</span>
                </div>
                <button className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  发布
                </button>
              </div>
            </section>

            {/* 内容列表 */}
            <div className="space-y-8">
              {mockMemos.map((memo) => (
                <MemoCard key={memo.id} memo={memo} />
              ))}
              <MemoCardSkeleton />
            </div>
          </div>
        </main>

        {/* 右侧边栏 */}
        <RightSidebar />
      </div>
    </div>
  );
}
