# JustMemo 接口设计规范 (API Spec)

> 最后更新：2026-02-28 (单日日历翻页与单向瀑布流模式)

## 1. 通用响应契约
所有接口遵循以下统一返回格式：
```ts
{
  success: boolean;    // 操作是否成功
  data?: T;           // 成功时返回的数据
  error?: string;      // 失败时的错误信息/代码
  message?: string;    // 可选的提示信息
}
```

## 2. Server Actions (Mutations - 仅管理员)

### 2.1 `createMemo` / `updateMemo` 系列
*   功能: 发布、编辑、状态切换。
*   输入: `formData` 或具体参数。
*   安全: 经过 Zod 强校验与 Supabase Auth 鉴权。

### 2.2 `deleteMemo` / `restoreMemo`
*   功能: 软删除（进入/移出垃圾箱）。

### 2.3 `batchDeleteMemos` / `batchAddTagsToMemos`
*   功能: 批量管理记录。

## 3. 读操作 (Queries - 双向流分页模式)

### 3.1 `getMemos` (核心分页)
*   参数: `params: { query?, limit?, before_date?, after_date?, tag?, date?, sort? }`
*   特性: 
    - **游标分页**: 彻底弃用 Offset。通过 `before_date` (向下) 或 `after_date` (向上) 确定数据起止点。
    - **优先级逻辑**: 若 `before_date` 或 `after_date` 存在，系统将自动忽略 `date` (Calendar Date) 过滤条件，以确保双向流在跨天滚动时不会被截断。
    - **智能脱敏**: 私密内容在物理层进行元数据抹除。

### 3.2 `getSingleDayMemosWithNeighbors` (单日翻页查询)
*   功能: 获取指定单日的日记内容，并探测存在日记的上一个/下一个日期。用于驱动 Calendar Pager 翻页模式。
*   参数: `params: { targetDate: string, adminCode?: string, tag?: string, query?: string }`
*   逻辑: 
    - 并发拉取 `targetDate` 当天的所有日记。
    - 利用 `limit(1)` 向前探测最近的一个 `prevDate`。
    - 利用 `limit(1)` 向后探测最近的一个 `nextDate`。
    - 返回 `{ memos, prevDate, nextDate }` 给前端渲染 "View Older" / "View Newer" 导航器。

### 3.3 `getArchivedMemos` / `getGalleryMemos` / `getTrashMemos`
*   功能: 特定维度的聚合过滤查询。

## 4. 统计与辅助 (Stats & Auth)

### 4.1 `getMemoStats_V2`
*   功能: 获取全量热力图及基础统计。
*   健壮性: 在无数据状态下返回合法的零值 JSON。

### 4.2 `getTimelineStats`
*   功能: 驱动侧边栏时间轴。
*   特性: 仅返回公开内容的统计分布。

### 4.3 `getCurrentUser` / `isAdmin`
*   功能: 身份与权限校验。
