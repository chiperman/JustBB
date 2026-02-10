import { getGalleryMemos } from "@/actions/fetchMemos";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import Link from "next/link";

export default async function GalleryPage() {
    const memos = (await getGalleryMemos()) || [];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <header className="flex items-center gap-2 py-4 px-6 border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <Link
                    href="/"
                    className="text-xl font-bold tracking-tight text-primary hover:opacity-80 transition-opacity p-1"
                >
                    JustMemo
                </Link>
                <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <span className="mx-1 opacity-40">/</span>
                    <span className="bg-primary/5 text-primary/80 px-2 py-0.5 rounded-sm text-xs font-mono tracking-tight">
                        Gallery
                    </span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-xl mx-auto space-y-12">
                    <section>
                        <header className="mb-10">
                            <h2 className="text-3xl font-serif font-bold tracking-tight mb-2 italic">画廊</h2>
                            <p className="text-muted-foreground text-sm font-sans tracking-wide opacity-70 italic whitespace-pre-line">
                                Visual fragments of memory. {"\n"}
                                每一张图片都是凝固的时间锚点。
                            </p>
                        </header>

                        <GalleryGrid memos={memos} />
                    </section>
                </div>
            </div>
        </div>
    );
}
