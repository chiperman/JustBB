import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMemoStats } from './memos/analytics';

// Mock Supabase Instance
const mockSupabase = {
    rpc: vi.fn().mockResolvedValue({ 
        data: { 
            totalMemos: 100, 
            totalTags: 50, 
            firstMemoDate: '2024-01-01', 
            days: {} 
        }, 
        error: null 
    }),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null })
};

// 预定义 Mock 环境变量
let mockEnv = {
    SUPABASE_MANAGEMENT_API_KEY: 'test_key',
    SUPABASE_PROJECT_REF: 'test_ref'
};

vi.mock('@/lib/supabase', () => ({
    getAdminClient: vi.fn(() => mockSupabase),
    getClient: vi.fn(async () => mockSupabase)
}));

vi.mock('@/lib/env', () => ({
    env: {
        get SUPABASE_MANAGEMENT_API_KEY() { return mockEnv.SUPABASE_MANAGEMENT_API_KEY },
        get SUPABASE_PROJECT_REF() { return mockEnv.SUPABASE_PROJECT_REF }
    }
}));

describe('getMemoStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock environment
        mockEnv = {
            SUPABASE_MANAGEMENT_API_KEY: 'test_key',
            SUPABASE_PROJECT_REF: 'test_ref'
        };
    });

    it('应该能正确获取基础统计数据', async () => {
        const result = await getMemoStats();

        expect(result.success).toBe(true);
        expect(result.data?.totalMemos).toBe(100);
        expect(result.data?.totalTags).toBe(50);
    });

    it('当数据库报错时应该返回零值对象', async () => {
        mockSupabase.rpc.mockResolvedValueOnce({
            data: null,
            error: { message: 'Database failure' }
        });

        const result = await getMemoStats();

        expect(result.success).toBe(false);
        expect(result.data?.totalMemos).toBe(0);
        expect(result.error).toBe('Database failure');
    });
});
