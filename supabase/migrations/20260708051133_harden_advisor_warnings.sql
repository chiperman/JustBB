-- 收紧 Supabase Advisor 指出的 WARN：RLS initplan、重复策略、公开写入与不必要的函数执行权限。
-- `search_memos_secure` 仍需允许 anon/authenticated 调用，以支持访客浏览锁定占位。

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_trgm'
      AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;

ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public memos are viewable by everyone" ON public.memos;
DROP POLICY IF EXISTS "Visitor read public" ON public.memos;
DROP POLICY IF EXISTS "Visitor no mutations" ON public.memos;
DROP POLICY IF EXISTS "Owners can read all own memos" ON public.memos;
DROP POLICY IF EXISTS "Authenticated users can create own memos" ON public.memos;
DROP POLICY IF EXISTS "Owners can update own memos" ON public.memos;
DROP POLICY IF EXISTS "Owners can delete own memos" ON public.memos;
DROP POLICY IF EXISTS "Admins can create own memos" ON public.memos;
DROP POLICY IF EXISTS "Admins can update own memos" ON public.memos;
DROP POLICY IF EXISTS "Admins can delete own memos" ON public.memos;
DROP POLICY IF EXISTS "Memos are readable by visibility" ON public.memos;

CREATE POLICY "Memos are readable by visibility"
ON public.memos FOR SELECT
TO anon, authenticated
USING (
  deleted_at IS NULL
  AND (
    is_private = FALSE
    OR (
      (SELECT auth.uid()) IS NOT NULL
      AND owner_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "Admins can create own memos"
ON public.memos FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update own memos"
ON public.memos FOR UPDATE
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete own memos"
ON public.memos FOR DELETE
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE INDEX IF NOT EXISTS idx_memos_owner_id
ON public.memos (owner_id);

ALTER TABLE public.r2_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own r2 config" ON public.r2_configs;
DROP POLICY IF EXISTS "Users can insert own r2 config" ON public.r2_configs;
DROP POLICY IF EXISTS "Users can update own r2 config" ON public.r2_configs;
DROP POLICY IF EXISTS "Users can delete own r2 config" ON public.r2_configs;

CREATE POLICY "Users can view own r2 config"
ON public.r2_configs FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own r2 config"
ON public.r2_configs FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own r2 config"
ON public.r2_configs FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own r2 config"
ON public.r2_configs FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DO $$
BEGIN
  IF to_regclass('public.keep_alive') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "pub_heartbeat_insert" ON public.keep_alive';
    EXECUTE 'DROP POLICY IF EXISTS "pub_heartbeat_update" ON public.keep_alive';
    EXECUTE 'DROP POLICY IF EXISTS "pub_heartbeat_read" ON public.keep_alive';
    EXECUTE 'DROP POLICY IF EXISTS "keep_alive read heartbeat" ON public.keep_alive';
    EXECUTE 'CREATE POLICY "keep_alive read heartbeat" ON public.keep_alive FOR SELECT TO anon, authenticated USING (true)';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_memo_stats_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  result JSONB;
  v_uid UUID;
BEGIN
  v_uid := (SELECT auth.uid());

  SELECT jsonb_build_object(
    'totalMemos', (
      SELECT COALESCE(count(*)::INT, 0)
      FROM public.memos
      WHERE deleted_at IS NULL
        AND (is_private = FALSE OR (v_uid IS NOT NULL AND owner_id = v_uid))
    ),
    'totalTags', (
      SELECT COALESCE(count(DISTINCT tag)::INT, 0)
      FROM (
        SELECT unnest(tags) AS tag
        FROM public.memos
        WHERE deleted_at IS NULL
          AND (is_private = FALSE OR (v_uid IS NOT NULL AND owner_id = v_uid))
      ) t
    ),
    'firstMemoDate', (
      SELECT COALESCE(min(created_at AT TIME ZONE 'Asia/Shanghai')::DATE::TEXT, NULL)
      FROM public.memos
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
            'wordCount', COALESCE(sum(word_count), 0)::INT
          ) AS stats
        FROM public.memos
        WHERE deleted_at IS NULL
          AND (is_private = FALSE OR (v_uid IS NOT NULL AND owner_id = v_uid))
        GROUP BY 1
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_timeline_stats(include_private BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  result JSONB;
  v_uid UUID;
BEGIN
  v_uid := (SELECT auth.uid());

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
        FROM public.memos
        WHERE deleted_at IS NULL
          AND (
            is_private = FALSE
            OR (
              include_private = TRUE
              AND v_uid IS NOT NULL
              AND owner_id = v_uid
            )
          )
        GROUP BY 1
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_distinct_tags()
RETURNS TABLE (tag_name TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := (SELECT auth.uid());

  RETURN QUERY
  SELECT unnest(m.tags) AS tag_name, count(*)::BIGINT AS count
  FROM public.memos m
  WHERE m.deleted_at IS NULL
    AND (m.is_private = FALSE OR (v_uid IS NOT NULL AND m.owner_id = v_uid))
  GROUP BY tag_name
  ORDER BY count DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_memo_stats_v2() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_timeline_stats(BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_distinct_tags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_memo_stats_v2() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_timeline_stats(BOOLEAN) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_distinct_tags() TO anon, authenticated, service_role;

DO $$
BEGIN
  IF to_regprocedure('public.get_database_size()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_database_size() SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_database_size() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_database_size() FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_database_size() TO service_role';
  END IF;

  IF to_regprocedure('public.get_archive_stats()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_archive_stats() SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_archive_stats() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_archive_stats() FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_archive_stats() TO service_role';
  END IF;

  IF to_regprocedure('public.get_tag_stats()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_tag_stats() SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_tag_stats() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_tag_stats() FROM anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_tag_stats() TO service_role';
  END IF;

  IF to_regprocedure('public.handle_new_user_profile()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user_profile() SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated';
  END IF;

  IF to_regprocedure('public.handle_new_user_role()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user_role() SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated';
  END IF;

  IF to_regprocedure('public.handle_updated_at()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_updated_at() SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated';
  END IF;

  IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated';
  END IF;

  IF to_regprocedure('public.set_memo_number()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.set_memo_number() SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.set_memo_number() FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.set_memo_number() FROM anon, authenticated';
  END IF;

  IF to_regprocedure('public.search_memos_secure(text, uuid[], integer, integer, jsonb, text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.search_memos_secure(text, uuid[], integer, integer, jsonb, text) SET search_path = public, extensions';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.search_memos_secure(text, uuid[], integer, integer, jsonb, text) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.search_memos_secure(text, uuid[], integer, integer, jsonb, text) TO anon, authenticated, service_role';
  END IF;
END $$;
