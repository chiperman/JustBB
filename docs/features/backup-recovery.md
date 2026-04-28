# Memos 备份与导出功能设计方案 (Backup & Export Design)

## 1. 功能定义 (Product Definition)

为用户提供一种可靠、透明且不中断浏览体验的数据备份方式。

### 1.1 核心目标

- **多格式支持**：提供 Markdown 和 JSON 两种主流格式。
- **无感导出**：采用后台分页拉取技术，用户在导出时可以继续使用应用。
- **进度可控**：用户可以随时暂停、继续或取消导出任务。

---

## 2. 产品路径 (User Journey)

1.  **启动**：用户点击侧边栏“设置”中的 **“导出 Memos”**。
2.  **配置**：弹出 Dialog，用户选择导出格式（.md 或 .json）。
3.  **运行**：点击“开始”后，Dialog 关闭，右下角弹出 **进度悬浮面板**。
4.  **控制**：用户在面板上看到实时进度（如 `520 / 1200`），并可点击 **[暂停]** 或 **[取消]**。
5.  **完成**：进度 100% 后自动触发浏览器下载，面板提示成功并于 3 秒后消失。

---

## 3. UI 设计规范 (UI Design)

### 3.1 导出配置弹窗 (`ExportConfigDialog`)

- **标题**：导出 Memos
- **选项**：使用 `RadioGroup` 展示 Markdown (推荐) 和 JSON 选项。
- **提示**：标注“图片将保留为链接形式”。

### 3.2 进度悬浮面板 (`ExportProgressPanel`)

- **位置**：`fixed bottom-4 right-4`
- **视觉**：采用毛玻璃效果 (Backdrop Blur)，包含一个进度条和微型控制按钮。
- **状态颜色**：
  - 导出中：Primary 蓝色/紫色
  - 已暂停：琥珀色 (Amber)
  - 错误：红色 (Destructive)

---

## 4. 技术架构 (Technical Architecture)

### 4.1 全局状态流 (`ExportContext`)

使用 React Context 管理全局导出状态，确保页面切换不丢失进度。

```typescript
type ExportStatus = "idle" | "exporting" | "paused" | "completed" | "error"

interface ExportState {
  status: ExportStatus
  progress: number // 当前抓取条数
  total: number // 总条数
  format: "md" | "json"
  data: any[] // 暂存的数据分片
}
```

### 4.2 分页引擎逻辑 (The Engine)

采用 **前端驱动的分页抓取 (Client-side Paging)** 模式：

1.  **初始化**：调用接口获取总条数 `total`。
2.  **循环抓取**：
    - 每次请求 100 条数据。
    - 在循环头部检查 `isPaused` 标志，若为 true 则通过 `Promise` 挂起。
    - 使用 `AbortController` 支持物理取消网络请求。
3.  **拼装与下载**：
    - **JSON**：`JSON.stringify` 整个数组。
    - **Markdown**：使用特定的 `Template` 字符串拼接每条 Memo。
    - **下载**：创建 `Blob` 对象并利用虚拟 `<a>` 标签触发。

### 4.3 异常处理

- **网络中断**：检测到错误时自动重试 3 次。
- **内存安全**：纯文本数据（1万条约 10MB）在现代浏览器内存中极其安全，无需担心溢出。
