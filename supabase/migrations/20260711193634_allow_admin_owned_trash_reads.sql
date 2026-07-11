-- 管理员需要读取自己已软删除的 Memo，供网页和 CLI 回收站使用；
-- 访客仍只能读取未删除公开 Memo，普通账号不能读取回收站。

DROP POLICY IF EXISTS "Memos are readable by visibility" ON public.memos;

CREATE POLICY "Memos are readable by visibility"
ON public.memos FOR SELECT
TO anon, authenticated
USING (
  (
    deleted_at IS NULL
    AND (
      is_private = FALSE
      OR (
        (SELECT auth.uid()) IS NOT NULL
        AND owner_id = (SELECT auth.uid())
      )
    )
  )
  OR (
    deleted_at IS NOT NULL
    AND (SELECT auth.uid()) IS NOT NULL
    AND owner_id = (SELECT auth.uid())
    AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
);
