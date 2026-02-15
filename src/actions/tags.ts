'use server';

import { createClient } from '@/utils/supabase/server';

export async function getAllTags() {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_distinct_tags');

    if (error) {
        console.error('Error fetching tags:', error);
        return [];
    }

    return data as { tag_name: string; count: number }[];
}
