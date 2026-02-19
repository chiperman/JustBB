# JustMemo 接口设计规范 (API Spec)

> 最后更新：2026-02-19

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

### 2.1 `createMemo`
*   功能: 发布新记录。
*   输入: `formData: { content: string, tags: string[], is_private: boolean, is_pinned: boolean, access_code?: string, access_code_hint?: string }`
*   校验: `content` 不能为空且需经过 Zod 校验。
*   内容规范: `content` 支持 Markdown 基本语法、`#标签` 和 `@编号`。

### 2.2 `updateMemoContent`
*   功能: 编辑记录内容及基本状态。
*   输入: `formData: { id: string, content: string, tags: string[], is_private: boolean, is_pinned: boolean }`

### 2.3 `updateMemoState`
*   功能: 仅更新记录的状态（私密/置顶/口令）。
*   输入: `formData: { id: string, is_private?: boolean, is_pinned?: boolean, access_code?: string, access_code_hint?: string }`

### 2.4 `deleteMemo` / `restoreMemo`
*   功能: 移入/移出垃圾箱（软删除）。
*   输入: `id: string`

### 2.5 `permanentDeleteMemo`
*   功能: 管理员永久物理删除单条记录。
*   输入: `id: string`

### 2.6 `emptyTrash`
*   功能: 清空回收站中所有已软删除的记录。
*   输入: 无

### 2.7 `batchDeleteMemos` / `batchAddTagsToMemos`
*   功能: 批量软删除或批量添加标签。
*   输入: 
    - `batchDeleteMemos`: `ids: string[]`
    - `batchAddTagsToMemos`: `ids: string[], tags: string[]`

### 2.8 `exportMemos` / `exportAllMemos`
*   功能: 导出特定格式的数据或获取全量数据。
*   输入: 
    - `exportMemos`: `format: 'json' | 'markdown'`
    - `exportAllMemos`: 无
*   安全: 仅限已认证管理员。

## 3. 身份验证与权限 (Auth Actions)

### 3.1 用户流
*   `login` / `signup`: 执行邮箱/密码登录或注册。
*   `logout`: 清理当前会话。
*   `verifyOtp`: 校验验证码（用于重置或两步验证）。
*   `sendPasswordResetEmail` / `updatePassword`: 处理密码重置逻辑。

### 3.2 辅助查询
*   `getCurrentUser`: 获取当前登录用户信息。
*   `isAdmin`: 校验当前用户是否具有管理员权限。
*   `checkUserExists`: 预检查邮箱占用情况。
*   `signInWithOAuth`: 发起第三方 OAuth 登录流程。

## 4. 鉴权与安全 (Safety Actions)

### 4.1 `unlockWithCode`
*   功能: 校验口令并解锁会话。
*   输入: `code: string`
*   返回: 成功时设置 HttpOnly Cookie，前端随后可重试获取内容。

### 4.2 `clearUnlockCode`
*   功能: 手动锁定当前会话，清除 Cookie。

## 4. 读操作 (Queries - 混合模式)

### 5.1 `getMemos` (Core Fetch)
*   参数: 支持分页、标签、年份、搜索词及隐私过滤。
*   特性: 针对访客自动隐藏私密内容，除非已成功解锁。

### 5.2 `getBacklinks` / `getMemoByNumber`
*   功能: 处理笔记间的双向关联与编号检索。
*   用途: 驱动前端的关联视图及输入建议。

### 5.3 `getOnThisDayMemos` / `getArchivedMemos`
*   功能: 检索“去年今日”记录或按时间周期浏览历史。

### 5.4 `getGalleryMemos` / `getTrashMemos`
*   功能: 专门提取多媒体内容或回收站中的待处理记录。

### 5.5 `getMemoStats` / `getTimelineStats`
*   功能: 获取全量热力图及时间轴归档聚合数据。

### 5.6 `getAllTags` (Tags)
*   功能: 获取全量标签及其计数，驱动侧边栏与建议项。

### 5.7 `getAllMemos` (Search Action)
*   功能: 获取全量数据以构建前端 `MemoCache`，支持极速本地搜索。
