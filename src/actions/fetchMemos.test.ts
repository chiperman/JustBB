import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMemos } from './fetchMemos';
import { createClient } from '@/utils/supabase/server';

// Mock Supabase client
vi.mock('@/utils/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('getMemos TDD', () => {
    const mockRpc = vi.fn();
    const mockSupabase = {
        rpc: mockRpc,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
    });

    it('should call search_memos_secure with default parameters', async () => {
        mockRpc.mockResolvedValue({ data: [], error: null });

        await getMemos({});

        expect(mockRpc).toHaveBeenCalledWith('search_memos_secure', {
            query_text: '',
            input_code: '',
            limit_val: 20,
            offset_val: 0,
            filters: {},
            sort_order: 'newest'
        });
    });

    it('should pass tag filter to RPC', async () => {
        mockRpc.mockResolvedValue({ data: [], error: null });

        await getMemos({ tag: 'TestTag' });

        expect(mockRpc).toHaveBeenCalledWith('search_memos_secure', expect.objectContaining({
            filters: { tag: 'TestTag' }
        }));
    });

    it('should pass date filter to RPC', async () => {
        mockRpc.mockResolvedValue({ data: [], error: null });

        await getMemos({ date: '2026-02-06' });

        expect(mockRpc).toHaveBeenCalledWith('search_memos_secure', expect.objectContaining({
            filters: { date: '2026-02-06' }
        }));
    });

    it('should handle pagination offset and limit', async () => {
        mockRpc.mockResolvedValue({ data: [], error: null });

        await getMemos({ limit: 10, offset: 20 });

        expect(mockRpc).toHaveBeenCalledWith('search_memos_secure', expect.objectContaining({
            limit_val: 10,
            offset_val: 20
        }));
    });

    it('should handle errors by returning empty array', async () => {
        mockRpc.mockResolvedValue({ data: null, error: { message: 'Database error' } });

        const result = await getMemos({});

        expect(result).toEqual([]);
    });
});
