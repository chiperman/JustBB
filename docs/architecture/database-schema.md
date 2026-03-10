# JustMemo 数据库设计与函数 (SQL)

> 最后更新：2026-03-10 (安全性增强与字段命名统一)

## 1. 数据模型 (memos 表)
*   `id`: uuid (PK)
*   `memo_number`: serial/identity (自增编号：1, 2, 3...，用于展示与引用)
*   `content`: text (明文)
*   `tags`: text[] (索引标签)
*   `locations`: jsonb (定位信息数组 [{name, lat, lng}, ...])
*   `access_code_hash`: text (使用 bcrypt 处理后的口令哈希)
*   `access_code_hint`: text (口令提示词)
*   `is_private`: boolean
*   `is_pinned`: boolean (置顶状态)
*   `pinned_at`: timestamptz (置顶时间，用于排序)
*   `deleted_at`: timestamptz (软删除状态，NULL 表示正常)
*   `created_at`: timestamptz
*   `word_count`: integer (字数统计，默认 0)

## 2. 核心安全函数 (RPC)

```sql
-- 安全检索函数：集成权限校验、关键隐私保护、Tag 搜索、日期筛选、游标分页与管理员特权
CREATE OR REPLACE FUNCTION search_memos_secure(
  query_text text DEFAULT '',
  input_code text DEFAULT NULL,
  limit_val int DEFAULT 20,
  offset_val int DEFAULT 0,
  filters jsonb DEFAULT '{}'::jsonb,
  sort_order text DEFAULT 'newest'
)
RETURNS TABLE (
  id uuid,
  memo_number int,
  content text,
  created_at timestamptz,
  tags text[],
  access_code_hint text,
  is_private boolean,
  is_pinned boolean,
  pinned_at timestamptz,
  is_locked boolean,
  word_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id, m.memo_number, 
    CASE 
      WHEN m.is_private = FALSE THEN m.content
      WHEN auth.uid() IS NOT NULL THEN m.content
      WHEN m.access_code_hash IS NOT NULL AND m.access_code_hash = crypt(input_code, m.access_code_hash) THEN m.content
      ELSE ''
    END as content,
    m.created_at, m.tags, 
    CASE WHEN m.is_private = TRUE THEN m.access_code_hint ELSE NULL END as access_code_hint, 
    m.is_private, m.is_pinned, m.pinned_at,
    CASE 
      WHEN m.is_private = FALSE THEN FALSE
      WHEN auth.uid() IS NOT NULL THEN FALSE
      WHEN m.access_code_hash IS NOT NULL AND m.access_code_hash = crypt(input_code, m.access_code_hash) THEN FALSE
      ELSE TRUE
    END as is_locked,
    CASE 
      WHEN (m.is_private = TRUE AND NOT (auth.uid() IS NOT NULL OR (m.access_code_hash IS NOT NULL AND m.access_code_hash = crypt(input_code, m.access_code_hash)))) THEN 0
      ELSE m.word_count
    END as word_count
  FROM memos m
  WHERE 
    m.deleted_at IS NULL
    AND (
      m.is_private = FALSE 
      OR (m.is_private = TRUE AND (
        (auth.uid() IS NOT NULL OR (m.access_code_hash IS NOT NULL AND input_code IS NOT NULL AND m.access_code_hash = crypt(input_code, m.access_code_hash)))
      ))
    )
    AND (
      (query_text = '' AND (filters->>'num' IS NOT NULL OR filters->>'tag' IS NOT NULL)) OR 
      m.content ILIKE '%' || query_text || '%' OR
      query_text = ANY(m.tags) OR
      (m.is_private = TRUE AND query_text = '')
    )
    AND (filters->>'tag' IS NULL OR filters->>'tag' = ANY(m.tags))
    AND (filters->>'num' IS NULL OR m.memo_number = (filters->>'num')::int)
    AND (filters->>'date' IS NULL OR (m.created_at AT TIME ZONE 'Asia/Shanghai')::DATE = (filters->>'date')::DATE)
    AND (filters->>'year' IS NULL OR EXTRACT(YEAR FROM m.created_at AT TIME ZONE 'Asia/Shanghai') = (filters->>'year')::int)
    AND (filters->>'month' IS NULL OR EXTRACT(MONTH FROM m.created_at AT TIME ZONE 'Asia/Shanghai') = (filters->>'month')::int)
    AND (filters->>'before_date' IS NULL OR m.created_at < (filters->>'before_date')::timestamptz)
    AND (filters->>'after_date' IS NULL OR m.created_at > (filters->>'after_date')::timestamptz)
    AND (filters->>'exclude_pinned' IS NULL OR m.is_pinned = FALSE)
  ORDER BY 
    CASE WHEN sort_order = 'oldest' THEN m.created_at END ASC NULLS LAST,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.is_pinned END DESC NULLS LAST,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.pinned_at END DESC NULLS LAST,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.created_at END DESC NULLS LAST
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;
```

### 支持的 filters 参数 (JSONB)
| 参数 | 类型 | 说明 |
|------|------|------|
| `tag` | string | 按标签过滤 |
| `num` | number | 按笔记编号精确匹配 |
| `date` | string (YYYY-MM-DD) | 按日期过滤（使用 Asia/Shanghai 本地时区） |
| `year` | number | 按年份过滤 |
| `month` | number | 按月份过滤 |
| `before_date` | timestamp | 游标：获取此时间之前的记录 |
| `after_date` | timestamp | 游标：获取此时间之后的记录 |
| `exclude_pinned` | boolean | 结果中排除置顶项（常用于无限滚动分页） |


-- 统计信息聚合函数 (V2)：一次请求获取热力图数据与基础统计
CREATE OR REPLACE FUNCTION get_memo_stats_v2()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalMemos', (SELECT COALESCE(count(*)::INT, 0) FROM memos WHERE deleted_at IS NULL),
    'totalTags', (SELECT COALESCE(count(DISTINCT tag)::INT, 0) FROM (SELECT unnest(tags) as tag FROM memos WHERE deleted_at IS NULL) t),
    'firstMemoDate', (SELECT COALESCE(min(created_at AT TIME ZONE 'Asia/Shanghai')::DATE::TEXT, NULL) FROM memos WHERE deleted_at IS NULL),
    'days', (
      SELECT COALESCE(jsonb_object_agg(day, stats), '{}'::JSONB)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 时间轴归档函数：获取月份归档计数（仅公开内容）
CREATE OR REPLACE FUNCTION get_timeline_stats()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'days', (
      SELECT COALESCE(jsonb_object_agg(day, stats), '{}'::JSONB)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 标签提取函数：获取所有已使用的标签
CREATE OR REPLACE FUNCTION get_distinct_tags()
RETURNS TABLE (tag_name TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) as tag_name, count(*)::BIGINT as count
  FROM memos
  WHERE deleted_at IS NULL
  GROUP BY tag_name
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;
```

### 支持的 filters 参数
| 参数 | 类型 | 说明 |
|------|------|------|
| `tag` | string | 按标签过滤 |
| `date` | string (YYYY-MM-DD) | 按日期过滤（使用 Asia/Shanghai 本地时区） |
| `before_date` | timestamp | 游标：获取此时间之前的记录（含） |
| `after_date` | timestamp | 游标：获取此时间之后的记录 |

## 3. 推荐索引 (Performance)

```sql
-- 高性能标签检索
CREATE INDEX idx_memos_tags ON memos USING GIN (tags);

-- 全文检索增强 (pg_trgm)
CREATE INDEX idx_memos_search_content ON memos USING gin (content gin_trgm_ops);

-- 地理位置检索
CREATE INDEX idx_memos_locations ON memos USING gin (locations);

-- 时间轴与公开内容优化索引
CREATE INDEX idx_memos_timeline_optimization ON memos (created_at) WHERE deleted_at IS NULL AND is_private = FALSE;

-- 排序与过滤复合索引
CREATE INDEX idx_memos_main_flow ON memos (is_pinned DESC, created_at DESC) WHERE deleted_at IS NULL;

-- 顺序 ID 唯一索引
CREATE UNIQUE INDEX idx_memos_number ON memos (memo_number);
```
