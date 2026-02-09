-- 创建轻量级时间轴数据统计函数
-- 仅返回日期对应的计数，去除全局统计和 unnecessary aggregation
CREATE OR REPLACE FUNCTION get_timeline_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'days', (
      SELECT jsonb_object_agg(day, stats)
      FROM (
        SELECT 
          (created_at AT TIME ZONE 'Asia/Shanghai')::DATE::TEXT AS day,
          jsonb_build_object(
            'count', count(*)
          ) AS stats
        FROM memos
        WHERE deleted_at IS NULL AND is_private = FALSE
        GROUP BY 1
      ) s
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 创建部分索引以加速公共 memo 的日期查询
-- 我们不仅需要 created_at，还需要它是 public 且未删除的
-- 使用 CONCURRENTLY 避免锁表（在生产环境中推荐，但这里通过工具直接执行可能不支持，视情况而定）
-- 注意：Supabase SQL Editor 通常支持标准 CREATE INDEX。
-- 这里的索引针对 time zone 转换后的 date 可能无法直接利用（除非创建函数索引），
-- 但对于 range scan `created_at` 依然有效。
-- 考虑到查询是全表聚合，覆盖索引 (Covering Index) 更有用。

DROP INDEX IF EXISTS idx_memos_timeline_optimization;

CREATE INDEX idx_memos_timeline_optimization 
ON memos (created_at) 
WHERE deleted_at IS NULL AND is_private = FALSE;
