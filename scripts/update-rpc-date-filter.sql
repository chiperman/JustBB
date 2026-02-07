-- 更新 search_memos_secure 函数，添加 date 过滤支持
-- 请在 Supabase SQL Editor 中执行此脚本

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
    -- 4. Tag 过滤
    AND (
      (filters->>'tag' IS NULL OR filters->>'tag' = ANY(m.tags))
    )
    -- 5. 媒体过滤
    AND (
      (filters->>'has_media' IS NULL OR (filters->>'has_media')::BOOLEAN = FALSE OR m.content ~ 'https?://\S+\.(jpg|jpeg|png|gif|webp)')
    )
    -- 6. 日期过滤 (新增)
    AND (
      (filters->>'date' IS NULL OR m.created_at::DATE = (filters->>'date')::DATE)
    )
  ORDER BY m.is_pinned DESC, m.created_at DESC
  LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
