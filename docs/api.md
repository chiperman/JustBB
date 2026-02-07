# JustMemo 接口设计规范 (API Spec)

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
*   **功能**: 发布新记录。
*   **输入**: `{ content: string, tags: string[], is_private: boolean, access_code?: string, access_code_hint?: string }`
*   **校验**: `content` 不能为空且需经过 Zod 校验。

### 2.2 `updateMemo`
*   **功能**: 编辑记录内容。
*   **输入**: `{ id: string, content: string, tags: string[] }`

### 2.3 `togglePrivacy`
*   **功能**: 切换公开/私密状态。
*   **输入**: `{ id: string, is_private: boolean, access_code?: string, access_code_hint?: string }`
*   **注意**: 设为私密时强制校验并在 DB 侧存储 Hash。

### 2.4 `softDeleteMemo` / `restoreMemo`
*   **功能**: 移入/移出垃圾箱。
*   **输入**: `{ id: string }`

### 2.5 `deleteMemoForever`
*   **功能**: 管理员手动彻底物理删除。
*   **输入**: `{ id: string }`

### 2.6 `togglePinned`
*   **功能**: 置顶/取消置顶。
*   **输入**: `{ id: string, is_pinned: boolean }`

### 2.7 `exportData`
*   **功能**: 一键导出所有数据。
*   **输入**: `{ format: 'json' | 'md' }`
*   **安全**: 仅限已认证管理员。

### 2.8 `translateContent`
*   **功能**: 调用 AI 进行内容翻译。
*   **输入**: `{ id: string, target_lang: 'zh' | 'en' }`
*   **特性**: 考虑到 API 成本，仅限管理员操作。

## 3. 鉴权与安全 (Visitor & Admin)

### 3.1 `unlockMemo`
*   **功能**: 校验口令并解锁会话。
*   **输入**: `{ id: string, input_code: string }`
*   **返回**: 成功时设置 HttpOnly Cookie，前端随后可重试获取内容。

## 4. 读操作 (Queries - 混合模式)

### 4.1 `searchMemosSecure` (Supabase RPC)
*   **参数**: 
    ```ts
    { 
      query_text: string; 
      input_code?: string; 
      limit: number; 
      offset: number;
      filters?: {
        has_media?: boolean;    // 画廊模式专用
        is_flashback?: boolean; // 去年今日专用
        year?: number;          // 月份轴定位
        month?: number;         // 月份轴定位
        tag?: string;           // 标签过滤
      }
    }
    ```
*   **返回**: `Memo[]`

### 4.2 `getStats` / `getTags`
*   **功能**: 侧边栏热力图与标签云。

### 4.3 `getArchiveStats`
*   **功能**: 获取右侧月份轴的目录数据。
*   **返回**: 归档列表 `Array<{ year: number, month: number, count: number }>`
