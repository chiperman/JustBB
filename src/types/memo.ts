export interface Memo {
    id: string;
    memo_number: number;
    content: string;
    created_at: string;
    tags: string[] | null;
    is_private: boolean;
    is_pinned: boolean;
    is_locked?: boolean;
    access_code_hint?: string;
    updated_at?: string;
    deleted_at?: string | null;
}
