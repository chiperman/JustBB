// Test date filter in search_memos_secure RPC
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDateFilter() {
    console.log('Testing date filter in search_memos_secure RPC...\n');

    const testDate = '2026-02-06';

    // Test with date filter
    console.log(`1. Fetching memos for date: ${testDate}`);
    const { data: filteredData, error: filteredError } = await supabase.rpc('search_memos_secure', {
        query_text: '',
        input_code: null,
        limit_val: 100,
        offset_val: 0,
        filters: { date: testDate }
    });

    if (filteredError) {
        console.error('Error with date filter:', filteredError);
        return;
    }

    console.log(`   Found ${filteredData?.length || 0} memos with date filter`);

    if (filteredData && filteredData.length > 0) {
        console.log('   Sample created_at dates:');
        filteredData.slice(0, 5).forEach((memo: any) => {
            const memoDate = new Date(memo.created_at).toISOString().split('T')[0];
            const match = memoDate === testDate ? '✅' : '❌';
            console.log(`     ${match} ${memo.created_at} (${memoDate})`);
        });

        // Check if all memos match the filter date
        const allMatch = filteredData.every((memo: any) => {
            const memoDate = new Date(memo.created_at).toISOString().split('T')[0];
            return memoDate === testDate;
        });

        console.log(`\n   All memos match date filter: ${allMatch ? '✅ YES' : '❌ NO - FILTER NOT WORKING'}`);
    }

    // Test without filter for comparison
    console.log('\n2. Fetching all memos (no filter) for comparison...');
    const { data: allData, error: allError } = await supabase.rpc('search_memos_secure', {
        query_text: '',
        input_code: null,
        limit_val: 100,
        offset_val: 0,
        filters: {}
    });

    if (allError) {
        console.error('Error without filter:', allError);
        return;
    }

    console.log(`   Found ${allData?.length || 0} memos without filter`);

    // Count distinct dates
    const dates = new Set(allData?.map((m: any) => new Date(m.created_at).toISOString().split('T')[0]));
    console.log(`   Distinct dates in all memos: ${dates.size}`);
    console.log('   Dates:', [...dates].sort().join(', '));
}

testDateFilter().catch(console.error);
