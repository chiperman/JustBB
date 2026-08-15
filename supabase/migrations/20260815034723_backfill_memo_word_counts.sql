-- 历史 LeanCloud 导入把 tag 单独写入 tags，未同步到正文。
-- 统一补上 #标签 后缀，并依最终正文重算缺失的字数。
WITH normalized AS (
  SELECT
    id,
    array_to_string(
      ARRAY(SELECT '#' || tag FROM unnest(tags) AS tag),
      ' '
    ) AS tag_suffix
  FROM public.memos
  WHERE deleted_at IS NULL
),
prepared AS (
  SELECT
    m.id,
    CASE
      WHEN n.tag_suffix <> '' AND m.content NOT LIKE '%' || n.tag_suffix
        THEN concat_ws(' ', rtrim(m.content), n.tag_suffix)
      ELSE m.content
    END AS next_content
  FROM public.memos AS m
  JOIN normalized AS n ON n.id = m.id
)
UPDATE public.memos AS m
SET
  content = p.next_content,
  word_count = char_length(btrim(p.next_content))
FROM prepared AS p
WHERE m.id = p.id
  AND (
    m.word_count = 0
    OR m.content IS DISTINCT FROM p.next_content
  );
