import { getAllTags } from "@/actions/tags";
import { TagsPageContent } from "@/components/pages/TagsPageContent";

export default async function TagsPage() {
    const tags = await getAllTags();

    return <TagsPageContent tags={tags} />;
}
