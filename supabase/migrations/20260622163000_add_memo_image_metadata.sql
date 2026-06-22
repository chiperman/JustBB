-- 20260622163000_add_memo_image_metadata.sql
-- 为图片附件保存宽高，便于画廊在图片加载前稳定预留比例。

ALTER TABLE public.memos
  ADD COLUMN IF NOT EXISTS image_metadata JSONB DEFAULT '{}'::JSONB NOT NULL;

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
  locations JSONB,
  images TEXT[],
  image_metadata JSONB
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
      AND (
        filters->>'num' IS NULL
        OR m.memo_number = ANY(
          ARRAY(
            SELECT unnest(string_to_array(filters->>'num', ','))::INT
          )
        )
      )
      AND (filters->>'date' IS NULL OR (m.created_at AT TIME ZONE 'Asia/Shanghai')::DATE = (filters->>'date')::DATE)
      AND (filters->>'year' IS NULL OR EXTRACT(YEAR FROM m.created_at AT TIME ZONE 'Asia/Shanghai')::INT = (filters->>'year')::INT)
      AND (filters->>'month' IS NULL OR EXTRACT(MONTH FROM m.created_at AT TIME ZONE 'Asia/Shanghai')::INT = (filters->>'month')::INT)
      AND (filters->>'before_date' IS NULL OR m.created_at <= (filters->>'before_date')::TIMESTAMPTZ)
      AND (filters->>'after_date' IS NULL OR m.created_at > (filters->>'after_date')::TIMESTAMPTZ)
      AND (filters->>'has_image' IS NULL OR cardinality(m.images) > 0)
      AND (filters->>'has_location' IS NULL OR (m.locations IS NOT NULL AND m.locations::TEXT <> '[]'))
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
    END AS word_count,
    b.locations,
    CASE
      WHEN b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked THEN b.images
      WHEN cardinality(b.images) > 0 THEN ARRAY['/images/locked-placeholder.png']::TEXT[]
      ELSE ARRAY[]::TEXT[]
    END AS images,
    CASE
      WHEN b.is_private = FALSE OR b.viewer_is_owner OR b.viewer_is_unlocked THEN b.image_metadata
      WHEN cardinality(b.images) > 0 THEN jsonb_build_object(
        '/images/locked-placeholder.png',
        jsonb_build_object('width', 118, 'height', 100)
      )
      ELSE '{}'::JSONB
    END AS image_metadata
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
        AND (
          CASE
            WHEN filters->>'tag_mode' = 'or' THEN
              string_to_array(filters->>'tag', ',') && b.tags
            ELSE
              string_to_array(filters->>'tag', ',') <@ b.tags
          END
        )
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

GRANT ALL ON TABLE public.memos TO postgres, anon, authenticated, service_role;
