/**
 * 可安全离开数据库层的 Memo 字段投影。
 * 明确排除 access_code_hash 等认证材料，供特殊直查 seam（UUID 分享、回收站）复用。
 */
export const MEMO_SAFE_SELECT = `
  id,
  memo_number,
  owner_id,
  content,
  tags,
  is_private,
  is_pinned,
  pinned_at,
  access_code_hint,
  word_count,
  locations,
  images,
  image_metadata,
  created_at,
  updated_at,
  deleted_at
`
