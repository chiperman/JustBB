import { getGalleryMemos } from "@/actions/memos/query";
import { GalleryPageContent } from "@/components/pages/GalleryPageContent";

export default async function GalleryPage() {
    const res = await getGalleryMemos();
    const memos = (res.success ? res.data : []) || [];

    return <GalleryPageContent memos={memos} />;
}
