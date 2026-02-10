import { getGalleryMemos } from "@/actions/fetchMemos";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import Link from "next/link";

export default async function GalleryPage() {
    const memos = (await getGalleryMemos()) || [];

    return (
        <div className="flex flex-col h-full overflow-hidden">
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
