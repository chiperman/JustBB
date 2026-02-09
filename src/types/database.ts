export type Memo = {
    id: string;
    memo_number: number;
    content: string;
    tags: string[];
    access_code: string | null;
    access_code_hint: string | null;
    is_private: boolean;
    is_pinned: boolean;
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
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                    word_count?: number;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            search_memos_secure: {
                Args: {
                    query_text?: string;
                    input_code?: string;
                    limit_val?: number;
                    offset_val?: number;
                    filters?: Record<string, unknown>;
                };
                Returns: {
                    id: string;
                    memo_number: number;
                    content: string;
                    created_at: string;
                    tags: string[];
                    access_code_hint: string;
                    is_private: boolean;
                    is_pinned: boolean;
                    is_locked: boolean;
                }[];
            };
        };
        Enums: {
            [_ in never]: never;
        };
    };
};
