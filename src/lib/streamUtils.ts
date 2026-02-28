import { Memo } from '@/types/memo';

/**
 * 双向流数据合并工具
 * 确保数据在向上或向下加载后：
 * 1. 唯一性：基于 ID 去重
 * 2. 顺序性：始终保持 created_at 降序（最新在顶）
 */
export function mergeMemos(existing: Memo[], incoming: Memo[]): Memo[] {
    const map = new Map<string, Memo>();
    
    // 将现有数据和新数据放入 Map 自动去重
    existing.forEach(m => map.set(m.id, m));
    incoming.forEach(m => map.set(m.id, m));
    
    // 转化为数组并按创建时间降序排列
    return Array.from(map.values()).sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

/**
 * 检查两个数据片段之间是否存在“空洞”
 * 如果新加载的最旧一条记录，依然比现有最新的记录更晚，且两者不连续
 */
export function hasGap(olderBatch: Memo[], newerBatch: Memo[]): boolean {
    if (olderBatch.length === 0 || newerBatch.length === 0) return false;
    // 逻辑：如果 newerBatch 的最旧一条和 olderBatch 的最新一条 ID 不匹配且时间跨度过大
    // 在游标分页下，通常通过判断返回数量是否达到 limit 来间接判断
    return false; // 初始实现暂不处理复杂断层
}
