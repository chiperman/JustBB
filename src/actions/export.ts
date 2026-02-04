'use server';

import { supabase } from '@/lib/supabase';
import { Memo } from '@/types/memo';

export async function exportAllMemos(): Promise<{ data: Memo[] | null; error: string | null }> {
    const { data, error } = await supabase
        .from('memos')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Export error:', error);
        return { data: null, error: error.message };
    }

    return { data: data as Memo[], error: null };
}

export async function exportMemos(format: 'json' | 'markdown'): Promise<string> {
    const { data, error } = await exportAllMemos();

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
tags: ${memo.tags?.join(', ') || ''}
---

${memo.content}
`;
        }).join('\n\n');
    }
}
