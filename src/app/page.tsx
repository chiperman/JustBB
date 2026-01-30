import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";

export default function Home() {
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
              <div className="text-muted-foreground italic text-sm mb-4">
                记录此刻的灵感...
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-2">
                  {/* 编辑器工具按键占位 */}
                </div>
                <button className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  发布
                </button>
              </div>
            </section>

            {/* 内容列表占位 */}
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-muted/20 h-48 rounded-2xl border border-border" />
              ))}
            </div>
          </div>
        </main>

        {/* 右侧边栏 */}
        <RightSidebar />
      </div>
    </div>
  );
}
