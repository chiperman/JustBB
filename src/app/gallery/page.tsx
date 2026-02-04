import { getGalleryMemos } from "@/actions/fetchMemos";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

export default async function GalleryPage() {
    const memos = (await getGalleryMemos()) || [];

    return (
        <div className="flex min-h-screen justify-center selection:bg-primary/20">
            <div className="flex w-full max-w-(--breakpoint-2xl)">
                {/* 左侧导航 */}
                <LeftSidebar />

                {/* 内容区域 */}
                <main className="flex-1 min-w-0 bg-background px-4 md:px-8 py-10">
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold tracking-tight mb-2">画廊 / Gallery</h1>
                            <p className="text-muted-foreground text-sm">Visual fragments of memory.</p>
                        </div>

                        <GalleryGrid memos={memos} />
                    </div>
                </main>

                {/* 右侧边栏 */}
                <RightSidebar />
            </div>
        </div>
    );
}
