-- Update search_memos_secure to support num filter and improve consistency
-- First drop existing variations to avoid overloading
DROP FUNCTION IF EXISTS search_memos_secure(text, text, int, int, json, text);
DROP FUNCTION IF EXISTS search_memos_secure(text, text, int, int, jsonb, text);

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
AS $$
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
        OR (query_text = '' AND filters->>'tag' IS NULL AND filters->>'num' IS NULL)
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
  ORDER BY 
    CASE WHEN sort_order = 'oldest' THEN m.created_at END ASC,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.is_pinned END DESC,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.pinned_at END DESC NULLS LAST,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN m.created_at END DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;
