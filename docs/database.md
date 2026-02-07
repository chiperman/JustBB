# JustMemo 数据库设计与函数 (SQL)

## 1. 数据模型 (memos 表)
*   `id`: uuid (PK)
*   `memo_number`: serial/identity (自增编号：1, 2, 3...，用于展示与引用)
*   `content`: text (明文)
*   `tags`: text[] (索引标签)
*   `access_code`: text (Hash 处理后的口令)
*   `access_code_hint`: text (口令提示词)
*   `is_private`: boolean
*   `is_pinned`: boolean (置顶状态)
*   `pinned_at`: timestamptz (置顶时间，用于排序)
*   `deleted_at`: timestamptz (软删除状态，NULL 表示正常)
*   `created_at`: timestamptz

## 2. 核心安全函数 (RPC)
```sql
-- 安全检索函数：集成权限校验、关键过滤、Tag 搜索、分页与管理员特权
CREATE OR REPLACE FUNCTION search_memos_secure(
  query_text TEXT DEFAULT '', 
  input_code TEXT DEFAULT NULL,
  limit_val INT DEFAULT 20,
  offset_val INT DEFAULT 0,
  filters JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  id UUID, 
  memo_number INT,
  content TEXT, 
  created_at TIMESTAMPTZ, 
  tags TEXT[], 
  access_code_hint TEXT,
  is_private BOOLEAN,
  is_pinned BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.memo_number, m.content, m.created_at, m.tags, m.access_code_hint, m.is_private, m.is_pinned
  FROM memos m
  WHERE 
    -- 1. 软删除过滤
    m.deleted_at IS NULL
    AND (
      -- 2. 权限校验
      m.is_private = FALSE OR
      auth.uid() IS NOT NULL OR
      (m.access_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code))
    )
    AND (
      -- 3. 关键词过滤
      m.content ILIKE '%' || query_text || '%' OR
      query_text = ANY(m.tags)
    )
    -- 4. 动态过滤器 (画廊、年份归档等)
    AND (
      (filters->>'has_media' IS NULL OR (filters->>'has_media')::BOOLEAN = FALSE OR m.content ~ 'https?://\S+\.(jpg|jpeg|png|gif|webp)')
    )
  ORDER BY m.is_pinned DESC, m.created_at DESC
  LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

## 3. 推荐索引 (Performance)
```sql
-- 高性能标签检索
CREATE INDEX idx_memos_tags ON memos USING GIN (tags);

-- 排序与过滤复合索引
CREATE INDEX idx_memos_main_flow ON memos (is_pinned DESC, created_at DESC) WHERE deleted_at IS NULL;

-- 顺序 ID 唯一索引
CREATE UNIQUE INDEX idx_memos_number ON memos (memo_number);
```
