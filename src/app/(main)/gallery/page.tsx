import { getGalleryMemos } from "@/actions/fetchMemos";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

export default async function GalleryPage() {
    const memos = (await getGalleryMemos()) || [];

    return (
        <div className="space-y-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight mb-2">画廊 / Gallery</h1>
                <p className="text-muted-foreground text-sm">Visual fragments of memory.</p>
            </div>

            <GalleryGrid memos={memos} />
        </div>
    );
}
