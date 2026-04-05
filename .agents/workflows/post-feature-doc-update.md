---
description: 强制 AI 自动检查和更新 /docs 文档 (Post-Feature Doc Update)
---

# 文档同步检查流 (Doc Update Enforcement)

本工作流用于解决 AI 在完成功能开发或 BUG 修复后，遗忘同步更新项目文档的问题。

**执行时机：**
当用户提出“功能开发完成”、“修复完毕”、“总结一下”或类似收尾指令时，或者当你自己意识到某个连贯的开发/重构动作结束时，**必须**主动执行此完整检查流，无需用户额外开启。

## 检查步骤与动作列表 (Actions)

1. **增量分析 (Diff Checklist)**
   - 使用 `git diff --name-only` 或阅读你在此任务中修改的文件列表。
   - 判断你的修改是否涉及以下领域：
     - [ ] **API 或类型 (Types/Interfaces)**：如果改了，需要更新 `docs/architecture/api-spec.md` 或相关设计文档吗？
     - [ ] **核心组件或状态 (State/Components)**：如果改了 UI 逻辑，需要更新 `docs/architecture/logic-architecture.md` 吗？
     - [ ] **构建、环境变量或安全配置 (Env/Build/RLS)**：如果改了，需要更新工程化相关文档或 `README.md` 吗？
     - [ ] **新增了一个独立功能 (New Feature)**：需要补充到 `docs/features/` 目录下吗？

2. **状态核对 (TODO Tracking)**
   - 检查 `docs/quality/engineering-todo.md`。
   - 如果你刚刚完成的操作正好解决了 TODO 里列出的某项 `[ ]`，立即将其修改为 `[x]`。

3. **执行更新 (Execute Update)**
   - **如果以上检查发现需要更新文档**：
     - 请自觉使用编辑工具 (如 `multi_replace_file_content` 或 `replace_file_content`) 对涉及的 `/docs` 目录下文件进行精准替换更新。
     - 更新完毕后，在回复给用户的消息中，明确列出你同步更新了哪些文档（例如：“我已同步更新了 `api-spec.md`，记录了最新的接口字段。”）。
   - **如果经过检查，完全没有需要更新的文档**：
     - 在给用户的最终回复中，加上一句：“（已检查过 `docs/` 文档，本次更新不涉及架构与接口变动，无需同步。）” 告知用户你没有偷懒。

> **警告此 Agent 自身：**
> 根据项目的《AI Agent 工作规范》第 6 条要求：“文档是系统的一部分，而非附属产物”。不更新文档视为提交了残缺的代码。严禁跳过此工作流！
