# JustMemo 数据库设计与函数 (SQL)

> 最后更新：2026-02-27 (工程化升级：同步核心函数隐私增强与排序优化)

## 1. 数据模型 (memos 表)
*   `id`: uuid (PK)
*   `memo_number`: serial/identity (自增编号：1, 2, 3...，用于展示与引用)
*   `content`: text (明文)
*   `tags`: text[] (索引标签)
*   `locations`: jsonb (定位信息数组 [{name, lat, lng}, ...])
*   `access_code`: text (Hash 处理后的口令)
*   `access_code_hint`: text (口令提示词)
*   `is_private`: boolean
*   `is_pinned`: boolean (置顶状态)
*   `pinned_at`: timestamptz (置顶时间，用于排序)
*   `deleted_at`: timestamptz (软删除状态，NULL 表示正常)
*   `created_at`: timestamptz
*   `word_count`: integer (字数统计，默认 0)

## 2. 核心安全函数 (RPC)

```sql
-- 安全检索函数：集成权限校验、关键过滤、Tag 搜索、日期筛选、分页与管理员特权
-- 特性：针对纯数字查询，Action 层会自动执行一次精确匹配并将其置顶，弥补 ILIKE 对编号的权重不足。
CREATE OR REPLACE FUNCTION search_memos_secure(
  query_text TEXT DEFAULT '', 
  input_code TEXT DEFAULT NULL,
  limit_val INT DEFAULT 20,
  offset_val INT DEFAULT 0,
  filters JSONB DEFAULT '{}'::JSONB,
  sort_order TEXT DEFAULT 'newest'
)
RETURNS TABLE (
  id UUID, 
  memo_number INT,
  content TEXT, 
  created_at TIMESTAMPTZ, 
  tags TEXT[], 
  access_code_hint TEXT,
  is_private BOOLEAN,
  is_pinned BOOLEAN,
  pinned_at TIMESTAMPTZ,
  is_locked BOOLEAN,
  word_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id, m.memo_number, 
    CASE 
      WHEN m.is_private = FALSE THEN m.content
      WHEN auth.uid() IS NOT NULL THEN m.content
      WHEN m.access_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code) THEN m.content
      ELSE ''
    END as content,
    m.created_at, m.tags, 
    CASE WHEN m.is_private = TRUE THEN m.access_code_hint ELSE NULL END as access_code_hint, 
    m.is_private, m.is_pinned, m.pinned_at,
    CASE 
      WHEN m.is_private = FALSE THEN FALSE
      WHEN auth.uid() IS NOT NULL THEN FALSE
      WHEN m.access_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code) THEN FALSE
      ELSE TRUE
    END as is_locked,
    CASE 
      WHEN (m.is_private = TRUE AND NOT (auth.uid() IS NOT NULL OR (m.access_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code)))) THEN 0
      ELSE m.word_count
    END as word_count
  FROM memos m
  WHERE 
    m.deleted_at IS NULL
    AND (
      m.is_private = FALSE 
      OR (m.is_private = TRUE AND (
        (auth.uid() IS NOT NULL OR (m.access_code IS NOT NULL AND input_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code)))
        OR (query_text = '' AND filters->>'tag' IS NULL)
      ))
    )
    AND (
      m.content ILIKE '%' || query_text || '%' OR
      query_text = ANY(m.tags) OR
      (m.is_private = TRUE AND query_text = '')
    )
    AND (filters->>'tag' IS NULL OR filters->>'tag' = ANY(m.tags))
    AND (filters->>'date' IS NULL OR (m.created_at AT TIME ZONE 'Asia/Shanghai')::DATE = (filters->>'date')::DATE)
  ORDER BY 
    CASE WHEN sort_order = 'oldest' THEN m.created_at END ASC,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.is_pinned END DESC,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.pinned_at END DESC NULLS LAST,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.created_at END DESC
  LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 统计信息聚合函数 (V2)：一次请求获取热力图数据与基础统计
CREATE OR REPLACE FUNCTION get_memo_stats_v2()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalMemos', (SELECT count(*)::INT FROM memos WHERE deleted_at IS NULL),
    'totalTags', (SELECT count(DISTINCT unnest(tags))::INT FROM memos WHERE deleted_at IS NULL),
    'firstMemoDate', (SELECT min(created_at AT TIME ZONE 'Asia/Shanghai')::DATE::TEXT FROM memos WHERE deleted_at IS NULL),
    'days', (
      SELECT jsonb_object_agg(day, stats)
      FROM (
        SELECT 
          (created_at AT TIME ZONE 'Asia/Shanghai')::DATE::TEXT AS day,
          jsonb_build_object(
            'count', count(*)::INT,
            'wordCount', sum(word_count)::INT
          ) AS stats
        FROM memos
        WHERE deleted_at IS NULL
        GROUP BY 1
      ) s
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 时间轴归档函数：获取月份归档计数（仅公开内容）
CREATE OR REPLACE FUNCTION get_timeline_stats()
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 标签提取函数：获取所有已使用的标签
CREATE OR REPLACE FUNCTION get_distinct_tags()
RETURNS TABLE (tag_name TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) as tag_name, count(*) as count
  FROM memos
  WHERE deleted_at IS NULL
  GROUP BY tag_name
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 支持的 filters 参数
| 参数 | 类型 | 说明 |
|------|------|------|
| `tag` | string | 按标签过滤 |
| `date` | string (YYYY-MM-DD) | 按日期过滤（使用 Asia/Shanghai 本地时区） |
| `has_media` | boolean | 过滤包含媒体的记录 |

## 3. 推荐索引 (Performance)

```sql
-- 高性能标签检索
CREATE INDEX idx_memos_tags ON memos USING GIN (tags);

-- 全文检索增强 (pg_trgm)
CREATE INDEX idx_memos_search_content ON memos USING gin (content gin_trgm_ops);

-- 时间轴与公开内容优化索引
CREATE INDEX idx_memos_timeline_optimization ON memos (created_at) WHERE deleted_at IS NULL AND is_private = FALSE;

-- 排序与过滤复合索引
CREATE INDEX idx_memos_main_flow ON memos (is_pinned DESC, created_at DESC) WHERE deleted_at IS NULL;

-- 顺序 ID 唯一索引
CREATE UNIQUE INDEX idx_memos_number ON memos (memo_number);
```
