import { Memo } from '@/types/memo';

export interface FilterParams {
    query?: string;
    tag?: string;
    year?: string;
    month?: string;
    date?: string;
    sort?: string;
}

export function clientFilterMemos(memos: Memo[], params: FilterParams): Memo[] {
    let result = [...memos];

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
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return isAsc ? timeA - timeB : timeB - timeA;
    });

    return result;
}
