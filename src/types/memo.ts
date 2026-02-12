export interface Memo {
    id: string;
    memo_number: number; // 全局自增编号，用于 @引用
    content: string;     // 包含 Markdown、#标签、@编号 的原文本
    created_at: string;
    tags: string[] | null; // 从正文正则提取出的标签数组
    is_private: boolean;
    is_pinned: boolean;
    pinned_at?: string | null;
    is_locked?: boolean;
    access_code_hint?: string;
    updated_at?: string;
    deleted_at?: string | null;
    word_count?: number;
    access_code?: string;
}

export interface TagStat {
    tag_name: string;
    count: number;
}
