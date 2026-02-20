import { getGalleryMemos } from "@/actions/fetchMemos";
import { GalleryPageContent } from "@/components/pages/GalleryPageContent";

export default async function GalleryPage() {
    const memos = (await getGalleryMemos()) || [];

    return <GalleryPageContent memos={memos} />;
}
