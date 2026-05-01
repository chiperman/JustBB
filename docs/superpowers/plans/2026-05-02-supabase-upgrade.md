# Supabase 升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目中的所有 Supabase 相关组件（CLI、JS SDK、SSR 辅助库）升级至最新稳定版，并确保本地开发环境与代码逻辑的一致性。

**Architecture:** 采用“先更新依赖、再重置环境、最后全量验证”的流水线模式。

**Tech Stack:** NPM, Supabase CLI, Docker, TypeScript, Vitest.

---

### Task 1: 更新 NPM 依赖包

**Files:**

- Modify: `/home/chiperman/code/JustBB/package.json`

- [ ] **Step 1: 安装最新版依赖**
      运行以下命令更新核心包：

```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest supabase@latest
```

- [ ] **Step 2: 验证安装结果**
      确认 `package.json` 中的版本号已更新，且 `npm list` 不显示版本冲突。

- [ ] **Step 3: 提交变更**

```bash
git add package.json package-lock.json
git commit -m "build(deps): 升级 Supabase 相关依赖至最新版本"
```

---

### Task 2: 环境重置与类型再生

**Files:**

- Modify: `/home/chiperman/code/JustBB/src/types/database.ts`

- [ ] **Step 1: 停止当前 Supabase 服务**

```bash
npx supabase stop
```

- [ ] **Step 2: 启动并拉取最新镜像**

```bash
npx supabase start
```

_预期输出：显示最新的服务版本号，且所有 Docker 容器状态为 Healthy。_

- [ ] **Step 3: 重新生成本地数据库类型**

```bash
npm run types:generate
```

- [ ] **Step 4: 检查类型文件变化**
      运行 `git diff src/types/database.ts` 确认是否有破坏性字段变更。

- [ ] **Step 5: 提交类型变更**

```bash
git add src/types/database.ts
git commit -m "chore(supabase): 同步最新数据库类型定义"
```

---

### Task 3: 全面回归测试

- [ ] **Step 1: 运行单元测试**
      运行：`npm run test:unit`
      _确保基础逻辑（如隐私过滤逻辑）在 SDK 升级后依然正确。_

- [ ] **Step 2: 运行集成测试**
      运行：`npm run test:integration`
      _验证真实的 Supabase RPC 调用（特别是 search_memos_secure）在最新驱动下工作正常。_

- [ ] **Step 3: 运行生产环境构建检查**
      运行：`npm run build`
      _确保升级后的包在 Turbopack 下依然能够成功编译。_

- [ ] **Step 4: 提交测试结果记录（如有必要调整代码）**
      若测试失败，根据报错进行微调并提交。
