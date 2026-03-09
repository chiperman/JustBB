import { getAllTags } from "@/actions/memos/analytics";
import { TagsPageContent } from "@/features/tags";

export default async function TagsPage() {
    const res = await getAllTags();
    const tags = res.success ? (res.data || []) : [];

    return <TagsPageContent tags={tags} />;
}
