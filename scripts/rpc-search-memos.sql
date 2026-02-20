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
    -- 脫敏處理：當為私密且未解鎖時，返回 0。
    CASE 
      WHEN (m.is_private = TRUE AND NOT (auth.uid() IS NOT NULL OR (m.access_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code)))) THEN 0
      ELSE m.word_count
    END as word_count
  FROM memos m
  WHERE 
    -- 1. 软删除过滤
    m.deleted_at IS NULL
    AND (
      -- 2. 权限校验
      m.is_private = FALSE 
      OR (m.is_private = TRUE AND (
        -- 管理员或正确口令
        (auth.uid() IS NOT NULL OR (m.access_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code)))
        -- 仅在非搜索模式（无关键字且无标签）下允许访客看到私密记录占位
        OR (query_text = '' AND filters->>'tag' IS NULL)
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
