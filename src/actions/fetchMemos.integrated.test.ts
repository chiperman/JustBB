import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// 只有在本地环境运行，保护生产数据
const isLocal = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('127.0.0.1') ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost') ||
    process.env.NODE_ENV === 'test';

describe('fetchMemos Integrated Tests', () => {
    if (!isLocal && process.env.NODE_ENV !== 'test') {
        it.skip('Skipping integrated fetch tests on non-local environment', () => { });
        return;
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

    it('should correctly filter memos by date in search_memos_secure RPC', async () => {
        // 1. 获取所有笔记以寻找一个有效的日期进行测试
        const { data: allData, error: allError } = await supabase.rpc('search_memos_secure', {
            query_text: '',
            limit_val: 10
        });

        if (allError || !allData || allData.length === 0) {
            console.warn('⚠️ No memos found in DB to test date filter. Skipping.');
            return;
        }

        // 2. 取第一个笔记的日期作为过滤条件
        const firstMemo = allData[0];
        const testDate = new Date(firstMemo.created_at).toISOString().split('T')[0];

        // 3. 执行日期过滤查询
        const { data: filteredData, error: filteredError } = await supabase.rpc('search_memos_secure', {
            query_text: '',
            filters: { date: testDate },
            limit_val: 100
        });

        expect(filteredError).toBeNull();
        expect(filteredData?.length).toBeGreaterThan(0);

        // 4. 验证所有返回的笔记是否都符合该日期
        const allMatch = filteredData?.every(memo => {
            const memoDate = new Date(memo.created_at).toISOString().split('T')[0];
            return memoDate === testDate;
        });

        expect(allMatch).toBe(true);
    });

    it('should return empty results for a non-existent date', async () => {
        const farFutureDate = '2099-12-31';

        const { data, error } = await supabase.rpc('search_memos_secure', {
            query_text: '',
            filters: { date: farFutureDate },
            limit_val: 10
        });

        expect(error).toBeNull();
        expect(data).toHaveLength(0);
    });
});
