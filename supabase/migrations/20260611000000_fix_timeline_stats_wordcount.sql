-- 修复 get_timeline_stats: 添加 wordCount 字段，支持按用户权限过滤
DROP FUNCTION IF EXISTS get_timeline_stats(boolean);
DROP FUNCTION IF EXISTS get_timeline_stats();

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
          AND (include_private = TRUE OR is_private = FALSE)
        GROUP BY 1
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$$;
