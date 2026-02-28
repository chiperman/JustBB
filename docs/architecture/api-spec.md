# JustMemo 接口设计规范 (API Spec)

> 最后更新：2026-02-28 (双向流模式：游标分页与上下文抓取支持)

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
*   参数: `params: { query?, limit?, before_date?, after_date?, tag?, sort? }`
*   特性: 
    - **游标分页**: 彻底弃用 Offset，通过 `before_date` (向下) 或 `after_date` (向上) 确定数据起止点。
    - **智能脱敏**: 私密内容在物理层进行元数据抹除（内容/标签置空，字数归零）。

### 3.2 `getMemosContext` (传送定位)
*   功能: 以目标日期为中心抓取上下文窗口。
*   参数: `params: { targetDate: string, limit: number }`
*   逻辑: 
    - 同时拉取 `targetDate` 之前的 10 条和之后的 10 条。
    - 确保用户点击时间轴跳转后，上下均有缓冲内容，实现丝滑漫游。

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
