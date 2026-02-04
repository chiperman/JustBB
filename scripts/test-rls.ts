
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables');
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
    console.log('--- Starting RLS & Security Test ---');

    // 1. Setup: Create a private test memo
    console.log('1. [Setup] Creating private test memo...');
    const { data: memo, error: createError } = await adminClient
        .from('memos')
        .insert({
            content: 'RLS_TEST_PRIVATE_CONTENT_' + Date.now(),
            is_private: true,
            access_code_hint: 'test_hint',
            memo_number: -1 // temporary number
        })
        .select()
        .single();

    if (createError || !memo) {
        console.error('Failed to create test memo:', createError);
        process.exit(1);
    }
    console.log('   Created Memo ID:', memo.id);

    try {
        // 2. Test Direct Table Access (Anon)
        console.log('2. [Test] Direct Table Access (Anon)');
        const { data: directData, error: directError } = await anonClient
            .from('memos')
            .select('*')
            .eq('id', memo.id);

        if (directError) {
            console.error('   Error querying:', directError);
        } else {
            console.log('   Result count:', directData.length);
            if (directData.length === 0) {
                console.log('   ✅ PASS: Private memo is hidden from direct anon selection.');
            } else {
                console.error('   ❌ FAIL: Private memo leaked in direct selection!');
                process.exit(1);
            }
        }

        // 3. Test RPC Access (Anon)
        console.log('3. [Test] RPC search_memos_secure Access (Anon)');
        const { data: rpcData, error: rpcError } = await anonClient
            .rpc('search_memos_secure', { query_text: '', limit_val: 100 }); // fetch enough

        if (rpcError) {
            console.error('   Error calling RPC:', rpcError);
            process.exit(1);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const target = rpcData.find((m: any) => m.id === memo.id);
            if (!target) {
                console.error('   ⚠️ WARN: Test memo not found in RPC results. (Maybe limit too small?)');
            } else {
                console.log('   Found memo in RPC result:', { is_locked: target.is_locked, content: target.content });
                if (target.is_locked === true && (!target.content || target.content === '')) {
                    console.log('   ✅ PASS: Private memo found but LOCKED and CONTENT HIDDEN.');
                } else {
                    console.error('   ❌ FAIL: Private memo exposed or not locked!');
                    process.exit(1);
                }
            }
        }

    } finally {
        // 4. Teardown
        console.log('4. [Teardown] Deleting test memo...');
        await adminClient.from('memos').delete().eq('id', memo.id);
        console.log('   Deleted.');
    }
    console.log('--- Test Finished Successfully ---');
}

runTest();
