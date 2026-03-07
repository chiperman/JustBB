import { extractTags, extractLocations, calculateWordCount } from '@/lib/memos/parser';
import { Database } from '@/types/database';

type MemoInsert = Database['public']['Tables']['memos']['Insert'];

/**
 * 从内容构建笔记的派生字段（标签、字数、定位），消除各 mutate 函数的重复逻辑
 */
export function buildMemoPayload(
    content: string,
    options?: { isPinned?: boolean }
): Pick<MemoInsert, 'content' | 'tags' | 'word_count' | 'locations'> & {
    is_pinned?: boolean;
    pinned_at?: string | null;
} {
    const payload: ReturnType<typeof buildMemoPayload> = {
        content,
        tags: extractTags(content),
        word_count: calculateWordCount(content),
        locations: extractLocations(content) as unknown as MemoInsert['locations'],
    };

    if (options?.isPinned !== undefined) {
        payload.is_pinned = options.isPinned;
        payload.pinned_at = options.isPinned ? new Date().toISOString() : null;
    }

    return payload;
}
