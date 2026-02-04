'use server';

import { supabase } from '@/lib/supabase';

export async function exportMemos(format: 'json' | 'markdown') {
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('is_private', false)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error || !data) {
        throw new Error('Failed to fetch memos');
    }

    if (format === 'json') {
        return JSON.stringify(data, null, 2);
    } else {
        return data.map(memo => {
            const date = new Date(memo.created_at).toLocaleString();
            return `---
id: ${memo.id}
date: ${date}
tags: ${memo.tags?.join(', ')}
---

${memo.content}
`;
        }).join('\n\n');
    }
}
