export interface Location {
    name: string;
    lat: number;
    lng: number;
}

export interface Memo {
    id: string;
    memo_number: number; // 全局自增编号，用于 @引用
    content: string;     // 包含 Markdown、#标签、@编号、📍定位 的原文本
    created_at: string;
    tags: string[] | null; // 从正文正则提取出的标签数组
    is_private: boolean;
    is_pinned: boolean;
    pinned_at?: string | null;
    is_locked?: boolean;
    access_code_hint?: string | null;
    updated_at?: string;
    deleted_at?: string | null;
    word_count?: number;
    access_code?: string | null;
    locations?: Location[] | null; // 从正文解析出的定位数组
}

export interface TagStat {
    tag_name: string;
    count: number;
}
