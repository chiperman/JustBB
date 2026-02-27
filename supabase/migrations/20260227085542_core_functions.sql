-- Core Database Functions for JustBB

-- 1. Get Timeline Stats
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

-- 2. Secure Search Function
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
        (auth.uid() IS NOT NULL OR (m.access_code IS NOT NULL AND m.access_code = crypt(input_code, m.access_code)))
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
  LIMIT limit_val
  OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

-- 3. Get Memo Stats V2 (Heatmap and General Stats)
CREATE OR REPLACE FUNCTION get_memo_stats_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_memos_timeline_optimization 
ON memos (created_at) 
WHERE deleted_at IS NULL AND is_private = FALSE;

CREATE INDEX IF NOT EXISTS idx_memos_search_content ON memos USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_memos_tags ON memos USING gin (tags);
