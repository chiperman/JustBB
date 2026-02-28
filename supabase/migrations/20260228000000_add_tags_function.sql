-- Add missing get_distinct_tags function

CREATE OR REPLACE FUNCTION get_distinct_tags()
RETURNS TABLE (tag_name TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(tags) as tag_name, count(*)::BIGINT as count
  FROM memos
  WHERE deleted_at IS NULL
  GROUP BY tag_name
  ORDER BY count DESC;
END;
$$;
