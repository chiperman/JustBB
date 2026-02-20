import { Memo } from '@/types/memo';

export interface FilterParams {
    query?: string;
    tag?: string;
    year?: string;
    month?: string;
    date?: string;
    sort?: string;
    isAdmin?: boolean;
    isOnline?: boolean;
}

export function clientFilterMemos(memos: Memo[], params: FilterParams): Memo[] {
    let result = memos.filter(m => !m.deleted_at);

    // 0. Privacy & Offline Safety Rules
    const isOnline = params.isOnline ?? true;
    const isAdmin = params.isAdmin ?? false;

    if (!isOnline) {
        // 离线状态：强制不可见所有私密或加密内容 (不管是否登录)
        result = result.filter(m => !m.is_private && !m.access_code);
    }
    // 在线状态下，放开对 is_private 的过滤。
    // 如果是非管理员，后端 RPC 会返回 content='' 且 is_locked=true 的占位记录，
    // 前端 MemoCard 能够识别并渲染为“锁定”样式。
    // 如果是管理员，则能看到完整内容。
    // else: 如果是在线管理员，显示全部 (result 保持不变)

    // 1. Tag Filter
    if (params.tag) {
        const targetTag = params.tag.toLowerCase();
        result = result.filter(memo =>
            memo.tags?.some(t => t.toLowerCase() === targetTag)
        );
    }

    // 2. Query Search
    if (params.query) {
        const q = params.query.toLowerCase();
        result = result.filter(memo =>
            memo.content.toLowerCase().includes(q) ||
            memo.memo_number.toString().includes(q)
        );
    }

    // 3. Date Filter
    if (params.date) {
        // params.date format: YYYY-MM-DD
        // memo.created_at format: ISO string (UTC)
        // Need to match based on local time (UTC+8 as per project convention)
        result = result.filter(memo => {
            const utcDate = new Date(memo.created_at);
            const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
            const dateStr = localDate.toISOString().split('T')[0];
            return dateStr === params.date;
        });
    } else if (params.year && params.month) {
        result = result.filter(memo => {
            const utcDate = new Date(memo.created_at);
            const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
            return localDate.getFullYear().toString() === params.year &&
                (localDate.getMonth() + 1).toString() === params.month;
        });
    } else if (params.year) {
        result = result.filter(memo => {
            const utcDate = new Date(memo.created_at);
            const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
            return localDate.getFullYear().toString() === params.year;
        });
    }

    // 4. Sort
    const isAsc = params.sort === 'oldest';
    result.sort((a, b) => {
        // First sort by pinned status
        if (a.is_pinned !== b.is_pinned) {
            return a.is_pinned ? -1 : 1;
        }

        // Then for pinned items, sort by pinned_at
        if (a.is_pinned && a.pinned_at !== b.pinned_at) {
            const pinnedA = new Date(a.pinned_at || 0).getTime();
            const pinnedB = new Date(b.pinned_at || 0).getTime();
            return pinnedB - pinnedA; // Always show newest pinned first
        }

        // Finally sort by created_at
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return isAsc ? timeA - timeB : timeB - timeA;
    });

    return result;
}
