import { describe, it, expect } from 'vitest';
import { mergeMemos } from './streamUtils';
import { Memo } from '@/types/memo';

describe('mergeMemos', () => {
    const createMockMemo = (id: string, date: string): Memo => ({
        id,
        content: `Content ${id}`,
        created_at: date,
        memo_number: parseInt(id),
        tags: [],
        is_private: false,
        word_count: 10,
        is_pinned: false,
        updated_at: date,
        locations: []
    } as unknown as Memo);

    it('应当正确合并数据并按时间降序排列', () => {
        const existing = [
            createMockMemo('2', '2026-02-20T10:00:00Z'),
            createMockMemo('1', '2026-02-10T10:00:00Z'),
        ];
        const incoming = [
            createMockMemo('3', '2026-02-25T10:00:00Z'),
        ];

        const result = mergeMemos(existing, incoming);

        expect(result.map(m => m.id)).toEqual(['3', '2', '1']);
    });

    it('应当自动处理重复数据 (De-duplication)', () => {
        const existing = [
            createMockMemo('2', '2026-02-20T10:00:00Z'),
            createMockMemo('1', '2026-02-10T10:00:00Z'),
        ];
        const incoming = [
            createMockMemo('2', '2026-02-20T10:00:00Z'), // 重复 ID
            createMockMemo('0', '2026-02-05T10:00:00Z'),
        ];

        const result = mergeMemos(existing, incoming);

        expect(result.map(m => m.id)).toEqual(['2', '1', '0']);
        expect(result.length).toBe(3);
    });

    it('应当能正确处理乱序插入', () => {
        const existing = [
            createMockMemo('5', '2026-02-25T10:00:00Z'),
            createMockMemo('1', '2026-02-01T10:00:00Z'),
        ];
        const incoming = [
            createMockMemo('3', '2026-02-15T10:00:00Z'),
        ];

        const result = mergeMemos(existing, incoming);

        expect(result.map(m => m.id)).toEqual(['5', '3', '1']);
    });
});
