import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseUsageStats } from './usage';

// Mock getSupabaseAdmin
const mockSupabase = {
    rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ count: 100, error: null })
};

vi.mock('@/lib/supabase', () => ({
    getSupabaseAdmin: vi.fn(() => mockSupabase)
}));

describe('getSupabaseUsageStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset environment variables
        process.env.SUPABASE_MANAGEMENT_API_KEY = 'test_key';
        process.env.SUPABASE_PROJECT_REF = 'test_ref';
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
        delete process.env.SUPABASE_MANAGEMENT_API_KEY;

        // Mock database responses for fallback
        // This is a simplified mock, real implementation will use getSupabaseAdmin
        const result = await getSupabaseUsageStats();

        expect(result.success).toBe(true);
        expect(result.isFullIndicator).toBe(false);
    });

    it('should handle management API errors gracefully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500
        });

        const result = await getSupabaseUsageStats();

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });
});
