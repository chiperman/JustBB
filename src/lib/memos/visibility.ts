import { Memo } from '@/types/memo';

export function canViewMemoContent(memo: Pick<Memo, 'id' | 'is_private' | 'owner_id' | 'is_owner'>, viewerId: string | null, unlockedMemoIds: string[] = []) {
    if (!memo.is_private) return true;
    if (memo.is_owner) return true;
    if (viewerId && memo.owner_id === viewerId) return true;
    return unlockedMemoIds.includes(memo.id);
}

export function redactLockedMemo<T extends Memo>(memo: T): T {
    return {
        ...memo,
        content: '',
        tags: [],
        word_count: 0,
        is_locked: true,
        is_owner: memo.is_owner ?? false,
    };
}

export function withViewerAccess<T extends Memo>(
    memo: T,
    viewerId: string | null,
    unlockedMemoIds: string[] = [],
    options: { allowLockedPlaceholder?: boolean } = {}
): T | null {
    const isOwner = Boolean(viewerId && memo.owner_id === viewerId);
    const canView = canViewMemoContent(memo, viewerId, unlockedMemoIds);
    const enrichedMemo = {
        ...memo,
        is_owner: memo.is_owner ?? isOwner,
        is_locked: memo.is_locked ?? !canView,
    } as T;

    if (canView) {
        return {
            ...enrichedMemo,
            is_locked: false,
            is_owner: memo.is_owner ?? isOwner,
        };
    }

    if (!options.allowLockedPlaceholder) {
        return null;
    }

    return redactLockedMemo({
        ...enrichedMemo,
        is_owner: isOwner,
    });
}
