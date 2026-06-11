-- 1. 重写写操作 RLS 策略，强卡只有 admin 角色的登录用户才能增删改
DROP POLICY IF EXISTS "Authenticated users can create own memos" ON public.memos;
DROP POLICY IF EXISTS "Owners can update own memos" ON public.memos;
DROP POLICY IF EXISTS "Owners can delete own memos" ON public.memos;

CREATE POLICY "Admins can create own memos"
ON public.memos FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid() 
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update own memos"
ON public.memos FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid() 
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  owner_id = auth.uid() 
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete own memos"
ON public.memos FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid() 
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- 2. 重写 search_memos_secure RPC，添加 locations 返回，支持 has_image 和 has_location 过滤，以及未解锁图片脱敏
DROP FUNCTION IF EXISTS search_memos_secure(TEXT, UUID[], INT, INT, JSONB, TEXT);

CREATE OR REPLACE FUNCTION search_memos_secure(
  query_text TEXT DEFAULT '',
  unlocked_ids UUID[] DEFAULT '{}'::UUID[],
  limit_val INT DEFAULT 20,
  offset_val INT DEFAULT 0,
  filters JSONB DEFAULT '{}'::JSONB,
  sort_order TEXT DEFAULT 'newest'
)
RETURNS TABLE (
  id UUID,
  memo_number INT,
  owner_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  tags TEXT[],
  access_code_hint TEXT,
  is_private BOOLEAN,
  is_pinned BOOLEAN,
  pinned_at TIMESTAMPTZ,
  is_locked BOOLEAN,
  is_owner BOOLEAN,
  word_count INT,
  locations JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      m.*,
      (auth.uid() IS NOT NULL AND m.owner_id = auth.uid()) AS viewer_is_owner,
      (m.id = ANY(unlocked_ids)) AS viewer_is_unlocked,
      (
        query_text = ''
        AND filters->>'tag' IS NULL
        AND filters->>'year' IS NULL
        AND filters->>'month' IS NULL
      ) AS allow_locked_placeholder
    FROM memos m
    WHERE
      m.deleted_at IS NULL
      AND (filters->>'exclude_pinned' IS NULL OR m.is_pinned = FALSE)
      AND (filters->>'num' IS NULL OR m.memo_number = (filters->>'num')::INT)
      AND (filters->>'date' IS NULL OR (m.created_at AT TIME ZONE 'Asia/Shanghai')::DATE = (filters->>'date')::DATE)
      AND (filters->>'year' IS NULL OR EXTRACT(YEAR FROM m.created_at AT TIME ZONE 'Asia/Shanghai')::INT = (filters->>'year')::INT)
      AND (filters->>'month' IS NULL OR EXTRACT(MONTH FROM m.created_at AT TIME ZONE 'Asia/Shanghai')::INT = (filters->>'month')::INT)
      AND (filters->>'before_date' IS NULL OR m.created_at <= (filters->>'before_date')::TIMESTAMPTZ)
      AND (filters->>'after_date' IS NULL OR m.created_at > (filters->>'after_date')::TIMESTAMPTZ)
      -- 过滤支持
      AND (filters->>'has_image' IS NULL OR m.content ILIKE '%![%](%)%')
      AND (filters->>'has_location' IS NULL OR (m.locations IS NOT NULL AND m.locations::TEXT <> '[]'))
  )
  SELECT
    b.id,
    b.memo_number,
    b.owner_id,
    CASE
      WHEN b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked THEN b.content
      WHEN b.content ILIKE '%![%](%)%' THEN '![Locked](/images/locked-placeholder.png)'
      ELSE ''
    END AS content,
    b.created_at,
    CASE
      WHEN b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked THEN b.tags
      ELSE ARRAY[]::TEXT[]
    END AS tags,
    CASE WHEN b.is_private = TRUE THEN b.access_code_hint ELSE NULL END AS access_code_hint,
    b.is_private,
    b.is_pinned,
    b.pinned_at,
    CASE
      WHEN b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked THEN FALSE
      ELSE TRUE
    END AS is_locked,
    b.viewer_is_owner AS is_owner,
    CASE
      WHEN b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked THEN b.word_count
      ELSE 0
    END AS word_count,
    b.locations
  FROM base b
  WHERE
    (
      b.is_private = FALSE
      OR b.viewer_is_owner
      OR b.viewer_is_unlocked
      OR b.allow_locked_placeholder
    )
    AND (
      filters->>'tag' IS NULL
      OR (
        (b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked)
        AND filters->>'tag' = ANY(b.tags)
      )
    )
    AND (
      query_text = ''
      OR (
        (b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked)
        AND (
          b.content ILIKE '%' || query_text || '%'
          OR query_text = ANY(b.tags)
        )
      )
    )
  ORDER BY
    CASE WHEN sort_order = 'oldest' THEN b.created_at END ASC,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN b.is_pinned END DESC,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN b.pinned_at END DESC NULLS LAST,
    CASE WHEN sort_order = 'newest' OR sort_order IS NULL THEN b.created_at END DESC
  LIMIT limit_val
  OFFSET offset_val;
END;
$$;


-- 3. 重塑三个统计及标签获取 RPC

-- get_timeline_stats 
CREATE OR REPLACE FUNCTION get_timeline_stats(include_private BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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
            'count', count(*)::INT,
            'wordCount', COALESCE(sum(word_count), 0)::INT
          ) AS stats
        FROM memos
        WHERE deleted_at IS NULL
          AND (
            is_private = FALSE 
            OR (
              include_private = TRUE 
              AND auth.uid() IS NOT NULL 
              AND owner_id = auth.uid()
            )
          )
        GROUP BY 1
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- get_memo_stats_v2
CREATE OR REPLACE FUNCTION get_memo_stats_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  result JSONB;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  
  SELECT jsonb_build_object(
    'totalMemos', (
      SELECT COALESCE(count(*)::INT, 0) 
      FROM memos 
      WHERE deleted_at IS NULL 
        AND (is_private = FALSE OR (v_uid IS NOT NULL AND owner_id = v_uid))
    ),
    'totalTags', (
      SELECT COALESCE(count(DISTINCT tag)::INT, 0) 
      FROM (
        SELECT unnest(tags) as tag 
        FROM memos 
        WHERE deleted_at IS NULL 
          AND (is_private = FALSE OR (v_uid IS NOT NULL AND owner_id = v_uid))
      ) t
    ),
    'firstMemoDate', (
      SELECT COALESCE(min(created_at AT TIME ZONE 'Asia/Shanghai')::DATE::TEXT, NULL) 
      FROM memos 
      WHERE deleted_at IS NULL 
        AND (is_private = FALSE OR (v_uid IS NOT NULL AND owner_id = v_uid))
    ),
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
          AND (is_private = FALSE OR (v_uid IS NOT NULL AND owner_id = v_uid))
        GROUP BY 1
      ) s
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- get_distinct_tags
CREATE OR REPLACE FUNCTION get_distinct_tags()
RETURNS TABLE (tag_name TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) AS tag_name, count(*)::BIGINT AS count
  FROM memos
  WHERE deleted_at IS NULL 
    AND (is_private = FALSE OR (auth.uid() IS NOT NULL AND owner_id = auth.uid()))
  GROUP BY tag_name
  ORDER BY count DESC;
END;
$$;
