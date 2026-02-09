-- 更新 search_memos_secure 函数以支持动态排序
-- 请在 Supabase SQL Editor 中执行此脚本

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
    m.word_count
  FROM memos m
  WHERE 
    -- 1. 软删除过滤
    m.deleted_at IS NULL
    AND (
      -- 2. 权限校验
      m.is_private = FALSE 
      OR (m.is_private = TRUE AND (
        (auth.uid() IS NOT NULL OR (m.access_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code)))
        -- 搜索模式下允许看到私密记录的占位（除非没有关键词且没有标签）
        OR (query_text <> '' OR filters->>'tag' IS NOT NULL)
      ))
    )
    AND (
      -- 3. 关键词过滤
      m.content ILIKE '%' || query_text || '%' OR
      query_text = ANY(m.tags) OR
      (m.is_private = TRUE AND query_text = '')
    )
    -- 4. Tag 过滤
    AND (filters->>'tag' IS NULL OR filters->>'tag' = ANY(m.tags))
    -- 5. 日期过滤
    AND (filters->>'date' IS NULL OR (m.created_at AT TIME ZONE 'Asia/Shanghai')::DATE = (filters->>'date')::DATE)
  ORDER BY 
    m.is_pinned DESC, 
    m.pinned_at DESC NULLS LAST,
    CASE WHEN sort_order = 'oldest' THEN m.created_at END ASC,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.created_at END DESC
  LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
