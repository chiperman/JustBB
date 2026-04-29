# 数据导入功能设计文档 (Data Import Design)

## 1. 目标 (Goal)

为 JustBB 增加数据导入功能，支持从现有备份（JSON/Markdown）以及 LeanCloud (JSONL) 导入数据，并确保数据不重复、不覆盖。

## 2. 需求场景 (Requirements)

- **支持格式**：
  - `.json`：项目原生的 JSON 导出格式。
  - `.md`：项目原生的 Markdown 导出格式。
  - `.jsonl`：LeanCloud 的数据导出格式。
- **判重机制**：
  - 优先通过 `id` 判定（仅限 JSON 备份）。
  - 兜底通过 `content` + `created_at` 判定。
  - 遇到重复数据直接跳过。
- **用户交互**：
  - 提供 `ImportModal` 弹窗。
  - 实时显示进度、成功数、跳过数和失败数。
  - 导入完成后用户手动关闭弹窗。

## 3. 技术设计 (Technical Design)

### 3.1 架构：独立 Service 模式

导入逻辑不放入全局 Context，而是封装在 `src/services/import/` 中，由 UI 组件按需调用。

### 3.2 数据解析器 (Parsers)

- **JSON Parser**:
  - 输入：JSON 字符串。
  - 输出：`Partial<Memo>[]`。
- **Markdown Parser**:
  - 正则表达式：`/### \[(.*?)\](?: .*?)?\r?\n(?:<!-- (.*?) -->\r?\n)?\r?\n([\s\S]*?)(?=\r?\n\r?\n---|\r?\n?$)/g`
  - 支持隐藏的元数据注释 `<!-- {...} -->`，用于还原 ID、置顶状态、最后修改时间、地理位置等全量字段。
  - 兼容旧版带表情符号（🌍/🔒/📌）的标题格式。
- **LeanCloud Parser (JSONL)**:
  - 逐行解析。
  - `tag` 字段：按 `#` 或空格拆分，提取有效标签数组。
  - `createdAt` -> `created_at`。

### 3.3 数据库操作

- **分批处理**：每 50 条数据为一个批次进行 Upsert。
- **冲突处理**：使用 Supabase 的 `onConflict` 或在插入前进行查询校验。

## 4. UI 界面设计

- **位置**：侧边栏设置区域或专门的设置页面。
- **反馈**：
  - 进度条。
  - 状态统计：`Total` | `Success` | `Skipped` | `Failed`。

## 5. 判重规则伪代码

```typescript
if (memo.id && isNativeBackup) {
  // 检查 id 是否存在
} else {
  // 检查 content == target.content AND created_at == target.created_at
}
```

## 6. 验证计划

- 导入导出过的 JSON 文件，验证是否全部被识别为“重复”并跳过。
- 导入提供的 `dream.0.jsonl`，验证内容、时间和标签解析是否正确。
- 导入 Markdown 备份，验证格式还原度。
