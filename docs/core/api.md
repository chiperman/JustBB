# JustMemo 接口与数据访问

> 最后更新：2026-04-26
> 状态：与当前代码同步

## 1. 作用

这份文档说明 JustMemo 当前的数据访问层长什么样，重点包括：

- Server Actions 的分组
- 查询入口的职责边界
- 私密 Memo 的读取与解锁语义
- 缓存与动态 API 的使用约束

## 2. 统一响应契约

Server Actions 统一返回：

```ts
{
  success: boolean;
  data?: T;
  error?: string;
}
```

约束：

- `success = false` 时必须给出可读错误信息
- `data` 的结构应尽量稳定，避免前端大量做兜底分支

## 3. 写操作入口

### 3.1 鉴权相关

主要位于认证 action 中，负责：

- 登录
- 注册
- 验证
- 密码更新

### 3.2 Memo 写操作

当前核心写操作包括：

- `createMemo`
- `updateMemoContent`
- `updateMemoState`
- `batchAddTagsToMemos`
- `verifyUnlockCode`
- `clearUnlockCode`

其中需要特别注意的是：

#### `createMemo` / `updateMemoState`

- 私密口令以明文输入进入 action
- 进入数据库前必须转成 `access_code_hash`
- 不允许明文口令落库

#### `verifyUnlockCode`

- 只验证单条 Memo
- 成功后直接返回这条可读 Memo 数据
- 不写 Cookie
- 客户端只把结果保存在当前页面内存态

#### `clearUnlockCode`

- 当前只是兼容旧调用链保留的空操作
- 它不负责清理任何持久化状态

## 4. 读操作入口

### 4.1 核心分页查询

主列表、搜索和大部分筛选都基于：

- `getMemos`

它的特点是：

- 走 RPC
- 支持分页
- 支持日期、标签、编号等过滤
- 支持 `unlockedMemoIds`

### 4.2 Mention 与编号查询

- `searchMemosForMention`：编辑器中的增量搜索
- `getMemoByNumber`：按编号获取单条 Memo

这两个入口都要遵守私密可见性规则，不能因为是“辅助查询”就绕过权限模型。

其中需要特别注意的是：

- `searchMemosForMention` 不会返回锁定态占位
- 即使底层查询在浏览场景下可能保留锁定占位，Mention 搜索结果也会额外过滤 `is_locked = true` 的结果
- `getMemoByNumber` 也不会把未解锁的私密 Memo 作为可读正文返回

### 4.3 地图查询

- `getMemosWithLocations`

这个查询允许返回锁定占位，因为地图需要先展示“有标记”，再决定是否展示正文。

### 4.4 统计与导出

- `getMemoStats`
- `getTimelineStats`
- `getAllTags`
- `exportMemos`

它们都不是“全站绝对统计”，而是基于当前查看者身份裁剪后的结果。

## 5. 私密 Memo 读取规则

接口层必须统一遵循以下模型：

- 作者本人可以直接读取自己的私密 Memo
- 非作者需要按条解锁
- 未解锁的私密 Memo 在搜索、标签等场景中不应进入真实结果
- 地图和主列表可根据场景返回锁定占位

## 6. 动态 API 约束

在 Server Actions 和 Server Components 中使用 Next.js 动态 API 时：

- 不要在业务深处直接散落调用 `cookies()` / `headers()`
- 应通过底层工厂函数统一创建服务端客户端实例
- 避免在循环和无控制的异步链中频繁调用动态 API

当前主要原则是：

- 先统一拿到 Supabase client
- 再在清晰的请求上下文里完成用户信息读取

## 7. 缓存与同步

### 7.1 页面级缓存

频繁读取的数据由 `PageDataCache` 负责按页面条件缓存。

### 7.2 UI 同步

局部更新与反馈优先通过：

- 统一状态层
- 轻量缓存
- 组件内显式刷新

来完成，而不是依赖大量隐式全局副作用。

## 8. 文档边界

这份文档回答“接口怎么组织”。

以下内容应分别查看：

- 权限与私密规则：看 [security.md](./security.md)
- SQL、RLS、RPC：看 [database.md](./database.md)
- 页面与状态流：看 [architecture.md](./architecture.md)
