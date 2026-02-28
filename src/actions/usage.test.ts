import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseUsageStats } from './usage';

// Mock getSupabaseAdmin
const mockSupabase = {
    rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ count: 100, error: null })
};

// 预定义 Mock 环境变量
let mockEnv = {
    SUPABASE_MANAGEMENT_API_KEY: 'test_key',
    SUPABASE_PROJECT_REF: 'test_ref'
};

vi.mock('@/lib/supabase', () => ({
    getSupabaseAdmin: vi.fn(() => mockSupabase)
}));

vi.mock('@/lib/env', () => ({
    env: {
        get SUPABASE_MANAGEMENT_API_KEY() { return mockEnv.SUPABASE_MANAGEMENT_API_KEY },
        get SUPABASE_PROJECT_REF() { return mockEnv.SUPABASE_PROJECT_REF }
    }
}));

describe('getSupabaseUsageStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock environment
        mockEnv = {
            SUPABASE_MANAGEMENT_API_KEY: 'test_key',
            SUPABASE_PROJECT_REF: 'test_ref'
        };
    });

    it('should calculate correct percentages and format units', async () => {
        // Mock global fetch for Management API
        const mockResponse = {
            db_size: { usage: 250 * 1024 * 1024 }, // 250MB
            storage_size: { usage: 500 * 1024 * 1024 }, // 500MB
            monthly_active_users: { usage: 10000 },
            db_egress: { usage: 1 * 1024 * 1024 * 1024 }, // 1GB
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        const result = await getSupabaseUsageStats();

        expect(result.success).toBe(true);
        expect(result.isFullIndicator).toBe(true);
        expect(result.data!.db.used).toBe(250);
        expect(result.data!.db.percentage).toBe(50); // 250/500
        expect(result.data!.mau.used).toBe(10000);
        expect(result.data!.mau.percentage).toBe(20); // 10000/50000
    });

    it('should fallback to SQL mode when API key is missing', async () => {
        mockEnv.SUPABASE_MANAGEMENT_API_KEY = undefined as unknown as string;

        const result = await getSupabaseUsageStats();

        expect(result.success).toBe(true);
        expect(result.isFullIndicator).toBe(false);
    });

    it('should fallback to SQL mode when Management API fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500
        });

        const result = await getSupabaseUsageStats();

        // 虽然 API 失败，但因为有 SQL 回退，整体依然返回成功，但 isFullIndicator 为 false
        expect(result.success).toBe(true);
        expect(result.isFullIndicator).toBe(false);
    });
});
