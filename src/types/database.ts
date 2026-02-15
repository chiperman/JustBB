export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Memo = {
    id: string;
    memo_number: number;
    content: string;
    tags: string[];
    access_code: string | null;
    access_code_hint: string | null;
    is_private: boolean;
    is_pinned: boolean;
    pinned_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    word_count: number;
};

export type Database = {
    public: {
        Tables: {
            memos: {
                Row: Memo;
                Insert: {
                    id?: string;
                    memo_number?: number;
                    content: string;
                    tags?: string[];
                    access_code?: string | null;
                    access_code_hint?: string | null;
                    is_private?: boolean;
                    is_pinned?: boolean;
                    pinned_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    word_count?: number;
                };
                Update: {
                    id?: string;
                    memo_number?: number;
                    content?: string;
                    tags?: string[];
                    access_code?: string | null;
                    access_code_hint?: string | null;
                    is_private?: boolean;
                    is_pinned?: boolean;
                    pinned_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    word_count?: number;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_memo_stats_v2: {
                Args: Record<string, never>;
                Returns: Json;
            };
            search_memos_secure: {
                Args: {
                    query_text?: string;
                    input_code?: string;
                    limit_val?: number;
                    offset_val?: number;
                    filters?: Json;
                    sort_order?: string;
                };
                Returns: {
                    id: string;
                    memo_number: number;
                    content: string;
                    created_at: string;
                    tags: string[];
                    access_code_hint: string | null;
                    is_private: boolean;
                    is_pinned: boolean;
                    pinned_at: string | null;
                    is_locked: boolean;
                    word_count: number;
                }[];
            };
            get_timeline_stats: {
                Args: Record<string, never>;
                Returns: Json;
            };
            get_distinct_tags: {
                Args: Record<string, never>;
                Returns: {
                    tag_name: string;
                    count: number;
                }[];
            };
        };
        Enums: {
            [_ in never]: never;
        };
    };
};
