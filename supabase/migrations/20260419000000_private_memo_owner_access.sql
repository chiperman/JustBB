-- Align private memo access with owner-based rules.

ALTER TABLE public.memos
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

UPDATE public.memos
SET owner_id = COALESCE(
    owner_id,
    (
        SELECT id
        FROM auth.users
        ORDER BY
            CASE WHEN raw_app_meta_data->>'role' = 'admin' THEN 0 ELSE 1 END,
            created_at ASC
        LIMIT 1
    )
)
WHERE owner_id IS NULL;

ALTER TABLE public.memos
ALTER COLUMN owner_id SET NOT NULL;

DROP POLICY IF EXISTS "Public memos are viewable by everyone" ON public.memos;
DROP POLICY IF EXISTS "Admins can read all memos" ON public.memos;
DROP POLICY IF EXISTS "Admins can create memos" ON public.memos;
DROP POLICY IF EXISTS "Admins can update memos" ON public.memos;
DROP POLICY IF EXISTS "Admins can delete memos" ON public.memos;

CREATE POLICY "Public memos are viewable by everyone"
ON public.memos FOR SELECT
USING (is_private = FALSE AND deleted_at IS NULL);

CREATE POLICY "Owners can read all own memos"
ON public.memos FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create own memos"
ON public.memos FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own memos"
ON public.memos FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own memos"
ON public.memos FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

DROP FUNCTION IF EXISTS search_memos_secure(TEXT, TEXT, INT, INT, JSONB, TEXT);
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
  word_count INT
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
  )
  SELECT
    b.id,
    b.memo_number,
    b.owner_id,
    CASE
      WHEN b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked THEN b.content
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
    END AS word_count
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
  WHERE deleted_at IS NULL AND is_private = FALSE
  GROUP BY tag_name
  ORDER BY count DESC;
END;
$$;
