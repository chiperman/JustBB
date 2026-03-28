import { Database } from './database';

export type Location = {
    name: string;
    lat: number;
    lng: number;
};

// 从数据库生成的类型中提取 Row 类型
type DBRow = Database['public']['Tables']['memos']['Row'];

/**
 * 业务层 Memo 类型
 * 
 * 我们基于数据库生成的 Row 类型进行扩展，
 * 显式排除敏感字段（如 access_code_hash），并对 JSON 类型进行具体化。
 */
export interface Memo extends Omit<DBRow, 'locations' | 'access_code_hash'> {
    /** 
     * 从正文解析出的定位数组 
     * 在数据库中以 JSON 存储，业务层需要明确其结构
     */
    locations?: Location[] | null;
    
    /**
     * 临时状态：是否已被锁定（用于口令检查逻辑）
     * 注意：这个属性由 RPC (search_memos_secure) 动态计算返回
     */
    is_locked?: boolean;
}

/**
 * 标签统计类型
 */
export interface TagStat {
    tag_name: string;
    count: number;
}
