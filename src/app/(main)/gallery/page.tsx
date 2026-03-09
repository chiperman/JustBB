import { getGalleryMemos } from "@/actions/memos/query";
import { GalleryPageContent } from "@/features/gallery";

export default async function GalleryPage() {
    const res = await getGalleryMemos();
    const memos = (res.success ? res.data : []) || [];

    return <GalleryPageContent memos={memos} />;
}
