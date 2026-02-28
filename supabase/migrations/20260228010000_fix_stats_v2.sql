-- Fix get_memo_stats_v2 and get_timeline_stats to be more robust

CREATE OR REPLACE FUNCTION get_memo_stats_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalMemos', (SELECT COALESCE(count(*)::INT, 0) FROM memos WHERE deleted_at IS NULL),
    'totalTags', (SELECT COALESCE(count(DISTINCT tag)::INT, 0) FROM (SELECT unnest(tags) as tag FROM memos WHERE deleted_at IS NULL) t),
    'firstMemoDate', (SELECT COALESCE(min(created_at AT TIME ZONE 'Asia/Shanghai')::DATE::TEXT, NULL) FROM memos WHERE deleted_at IS NULL),
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
        GROUP BY 1
      ) s
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

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
      SELECT COALESCE(jsonb_object_agg(day, stats), '{}'::JSONB)
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
