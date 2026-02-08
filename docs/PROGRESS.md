# JustMemo 功能点追踪清单

> **文档目的**：罗列所有需要开发的功能点，用于追踪开发进度。  
> **生成日期**：2026-02-06  
> **更新日期**：2026-02-08（已更新：全站 UI 样式统一、去椭圆化、热力图 Tooltip 边缘对齐、侧边栏动画平滑化）  
> **数据来源**：`/docs/Refactor_PRD.md` 及 `/docs/modules/*.md`

---

## 一、布局与页面结构

### 1.1 三栏响应式布局
- [x] **左侧边栏 (Fixed)**：固定导航、热力图、标签云
- [x] **中间主区域 (Scroll)**：内容流与发布框
- [x] **右侧区域 (Fixed)**：时间/月份轴导航
- [x] **移动端适配**：三栏布局正确转化为单栏 (已实现汉堡菜单与侧边栏抽屉)

---

## 二、左侧边栏功能

### 2.1 贡献热力图 (Heatmap)
- [x] 展示一年内记录频率
- [x] Hover 交互：显示具体日期与发帖计数（如："2025-05-20: 记录了 5 条 BB"）

### 2.2 标签云 (Tag Cloud)
- [x] 基于正则提取内容中 `#标签`
- [x] 支持点击过滤

### 2.3 去年今日 (Flashback)
- [x] 自动回溯往年历史记录

### 2.4 主题切换 (Theme Toggle)
- [x] 入口位于侧边栏底部
- [x] 模式：循环切换 (浅色 -> 深色 -> 自动)

### 2.5 画廊模式 (Gallery Mode)
- [x] 开关位于左侧边栏
- [x] 点击后进入网格视图 (Grid View)，仅展示包含多媒体 URL 的卡片
- [x] 或直接瀑布流展示图片缩略图

---

## 三、右侧区域功能

### 3.1 时间/月份轴 (Navigation Archive)
- [x] 位于页面最右侧
- [x] UI：垂直方向的时间线/刻度
- [x] 自动按年-月归档
- [x] 点击对应月份瞬间滚动定位或重新加载该时段数据

---

## 四、中间主区域功能

### 4.1 极简发布框
- [x] 快捷键：支持 `Ctrl/Cmd + Enter` 快速发送
- [x] 多媒体支持：仅限 URL 输入
- [x] Markdown 格式解析
- [x] 自动识别 R2 图片直链
- [x] 多语言代码块 (Code Blocks) 支持
- [x] **不支持**文件/图片拖拽上传

### 4.2 标签系统 (Tagging Logic)
- [x] 放弃从正文正则提取，在输入框下方设有独立的标签展示与录入区
- [x] 联想补全：输入时自动匹配已有标签列表
- [x] 正文保持：发送时不对正文内容进行任何 `#` 符号的剔除或清洗
- [x] 存储：正文存入 `content`，选中的唯一标签集合存入 `tags` (Array)

### 4.3 内容渲染 (Rendering)
- [x] Markdown 解析：使用 `react-markdown` 或 `shiki`
- [x] 代码高亮：深度适配主题
- [x] 行号显示
- [x] 一键复制代码

### 4.4 内容流布局
- [x] 瀑布流 (Waterfall/Masonry) 布局
- [x] 排序：置顶内容 (Pinned) 按 `pinned_at` 时间排序，其余按 `created_at` 倒序
- [x] 分页加载：无限滚动 (Infinite Scroll) 模式
- [x] 初始仅加载 20 条，随滚动动态获取后续内容
- [x] Next.js 15 Streaming + 骨架屏 (Skeleton Screens)

### 4.5 关联引用 (Referencing)
- [x] 输入 `@` 触发最近记录搜索列表
- [x] 支持关键词过滤与键盘上下键选择
- [x] 选中后插入 `@编号`
- [x] 悬浮交互：鼠标移动至引用上时，弹出 Popover 显示所引用的 BB 正文预览
- [x] 反向链接：卡片底部展示"引用了该 BB 的其他记录"

### 4.6 卡片分享 (Share)
- [x] 卡片上提供"分享"按钮
- [x] **模式 A (链接)**：复制该 BB 的独立详情页 URL
- [x] **模式 B (图片/海报)**：
  - [x] 生成渲染精美的图片海报
  - [x] QR 码：图片右下角自动生成指向该 BB 详情页的二维码
  - [x] 一键保存到本地或调用系统分享

### 4.7 搜索系统
- [x] 支持关键词模糊搜索
- [x] 支持 `#标签` 精确匹配
- [x] 规则：仅检索已解锁或公开内容
- [ ] 响应时间 < 200ms（未验证）

---

## 五、登录模块

### 5.1 管理员登录
- [x] 登录入口：左侧边栏提供"管理员登录"按钮
- [x] 使用 Supabase Auth (Email/Password) 进行身份验证
- [x] 登录成功后自动刷新页面状态
- [x] 支持"记住登录状态"功能 (基于 Supabase Session 持久化)

### 5.2 登录状态管理
- [x] 登录状态持久化（基于 HttpOnly Cookie 与 Supabase Session）
- [x] 显示当前登录用户信息（Email/用户图标）
- [x] 提供登出按钮
- [x] 登出后清除本地会话，页面降级为只读模式

---

## 六、管理操作 (仅管理员登录可见)

### 6.1 隐私状态切换
- [x] 入口：悬浮 (Hover) 在卡片上时显现
- [x] 一键切换 `Public` / `Private`
- [x] 安全弹窗：切换至 `Private` 时必须弹出对话框要求输入解密口令与提示词
- [x] 已有关联口令的私密转公开时需二次确认

### 6.2 编辑功能
- [x] 原位编辑模式：点击后卡片 UI 转化为输入框
- [x] 支持实时保存

### 6.3 删除 (垃圾箱)
- [x] 执行软删除 (Soft Delete)，BB 仅在垃圾箱视图可见
- [x] 垃圾箱视图支持一键恢复
- [x] 垃圾箱视图支持手动彻底删除
- [x] 系统不执行自动物理清理，除非管理员主动操作

### 6.4 置顶功能
- [x] 置顶/取消置顶操作
- [x] 置顶按 `pinned_at` 时间排序（先置顶的排在前面）
- [ ] 支持拖拽调整置顶顺序（可选）

### 6.5 数据导出
- [x] 功能：支持一键导出所有记录
- [x] 格式：Markdown (适合阅读) 和 JSON (适合备份) 两种选择
- [x] 入口：位于侧边栏设置区域

### 6.6 AI 翻译 (可选功能)
- [ ] 调用 AI 进行内容翻译
- [ ] 支持中英文互译
- [ ] 仅限管理员操作（考虑 API 成本）

---

## 七、安全与隐私架构

### 7.1 隐私策略
- [x] 物理隔离方案：采用服务端 Supabase RPC 校验
- [x] 可见性控制：默认 Public，支持 `is_private` 标记

### 7.2 解锁流程 (Unlock Flow)
- [x] 视觉屏蔽：锁定内容通过高斯模糊 (Gaussian Blur) 针对"占位文本"进行渲染
- [x] 展示口令提示词 (Hint)
- [x] 验证机制：采用 Server Action + HttpOnly Cookie 实现 Hash 校验
- [x] 会话保持与离线：用户输入密码成功后，写入加密 Cookie
- [ ] 支持在 Session 内缓存已解密内容
- [ ] 联网解锁后，短时间内离线仍可阅读已解锁的 BB

### 7.3 鉴权逻辑
- [x] 管理员：使用 Supabase Auth (Email/Login) 管理发布、编辑与删除权限
- [x] 已登录的管理员自动拥有全站内容（包括私密）的免密查看权
- [ ] 未登录用户降级为只读模式
- [x] 写操作保护：开启数据库 RLS (Row Level Security) (已验证)

### 7.4 访客权限
- [x] 基于 RPC 函数的口令匹配获取内容
- [ ] 离线状态下，若未提前解锁，则无法通过 RPC 获取解密内容

---

## 八、设计系统

### 8.1 视觉风格
- [x] 深度致敬 Anthropic 风格
- [x] 追求纸质书写的温润感与学术优雅

### 8.2 配米系统 (Color Palette)
- [x] 使用 `next-themes` 实现主题切换
- [x] **浅色模式 (Light Mode - Paper)**
  - [x] 背景色: `#fdfcf8` (暖白纸张感)
  - [x] 前景色: `#191919` (柔和炭黑)
  - [x] 卡片背景: `#ffffff`
- [x] **深色模式 (Dark Mode - Ink)**
  - [x] 背景色: `#121212` (深灰墨色)
  - [x] 前景色: `#e5e5e5` (淡灰文字)
  - [x] 卡片背景: `#1e1e1e`
- [x] **共享强调色**
  - [x] 主强调: `#d97757` (赤陶色)
  - [x] 次强调: `#3f6212` (深橄榄色)
  - [x] 状态色: 成功 `#40c463` / 失败 `#ff6b6b` (已添加)

### 8.3 排版系统 (Typography)
- [x] 标题 (Serif): 'Times New Roman', 'Georgia', serif
- [x] 正文 (Sans): 'Inter', system-ui, sans-serif
- [x] 代码 (Mono): 'ui-monospace', 'SFMono-Regular', monospace
- [x] 交互逻辑：支持用户在前端一键切换 Serif/Sans 字体

### 8.4 交互反馈与动效
- [x] 通知：使用顶部弹窗 (Toast/Popup) 提醒
- [x] 动效：基于 Framer Motion 实现瀑布流卡片的平滑加载与渐显

---

## 九、数据库设计

### 9.1 数据模型 (memos 表)
- [x] `id`: uuid (PK)
- [x] `memo_number`: serial/identity (自增编号)
- [x] `content`: text (明文)
- [x] `tags`: text[] (索引标签)
- [x] `access_code`: text (Hash 处理后的口令)
- [x] `access_code_hint`: text (口令提示词)
- [x] `is_private`: boolean
- [x] `is_pinned`: boolean (置顶状态)
- [x] `pinned_at`: timestamptz (置顶时间，用于排序)
- [x] `deleted_at`: timestamptz (软删除状态)
- [x] `created_at`: timestamptz

### 9.2 核心安全函数 (RPC)
- [x] `search_memos_secure`: 安全检索函数，集成权限校验、关键过滤、Tag 搜索、分页与管理员特权

### 9.3 推荐索引 (Performance)
- [x] `idx_memos_tags`: 高性能标签检索 (GIN 索引)
- [x] `idx_memos_main_flow`: 排序与过滤复合索引（含 `pinned_at`）
- [x] `idx_memos_number`: 顺序 ID 唯一索引

---

## 十、接口设计 (API)

### 10.1 Server Actions (Mutations - 仅管理员)
- [x] `createMemo`: 发布新记录
- [x] `updateMemo`: 编辑记录内容
- [x] `togglePrivacy`: 切换公开/私密状态
- [x] `softDeleteMemo`: 移入垃圾箱
- [x] `restoreMemo`: 从垃圾箱恢复
- [x] `deleteMemoForever`: 彻底物理删除
- [x] `togglePinned`: 置顶/取消置顶（同时更新 `pinned_at`）
- [x] `exportData`: 一键导出所有数据
- [ ] `translateContent`: AI 翻译内容

### 10.2 鉴权与安全
- [x] `unlockMemo`: 校验口令并解锁会话
- [x] `login`: 管理员登录 (Supabase Auth)
- [x] `logout`: 管理员登出

### 10.3 读操作 (Queries)
- [x] `searchMemosSecure` (Supabase RPC): 支持关键词、口令、分页、动态过滤器
- [x] `getStats`: 侧边栏热力图数据
- [x] `getTags`: 标签云数据
- [x] `getArchiveStats`: 右侧月份轴的目录数据
- [x] `getCurrentUser`: 获取当前登录用户信息

---

## 十一、工程规范

### 11.1 技术栈
- [x] Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS
- [x] UI Components: shadcn/ui, Framer Motion
- [x] Infrastructure: Supabase (DB/Auth/Storage), Vercel (Hosting)
- [x] Extra: `next-themes` (主题切换), `next-pwa`

### 11.2 Git 规范
- [x] ESLint + Prettier (含 Tailwind 类名自动排序)
- [x] 原子化提交 (Atomic Commits)
- [x] Commitizen 格式: `type(scope): subject`
- [x] Pre-commit (Husky + lint-staged)
- [x] Commit-msg (Commitlint)
- [x] Pre-push 自动运行 build/test

### 11.3 CI/CD
- [x] 关联 GitHub 仓库
- [x] Vercel 自动部署生产环境

### 11.4 PWA 支持
- [x] PWA 安装后支持离线开启

---

## 十二、测试与质量保证

### 12.1 单元测试 (Unit Tests)
- [x] 工具: Vitest + React Testing Library
- [x] 正文解析：`@编号` 引用解析、Markdown 转换逻辑
- [ ] 权限计算：判断 `is_private` 与用户身份的各种组合结果
- [ ] 工具函数：时间格式化、标签清洗算法、Hash 辅助函数

### 12.2 接口与逻辑测试 (Integration Tests)
- [ ] 工具: Vitest + Supabase Local Development
- [ ] 权限过滤：调用 `searchMemosSecure` 确保无权者绝对拿不到私密内容
- [ ] 录入校验：`createMemo` 对非法输入的拦截

### 12.3 端到端测试 (E2E Tests)
- [ ] 工具: Playwright
- [ ] 管理员流：登录 -> 发布 -> 置顶 -> 切换隐私 -> 彻底删除
- [ ] 访客解锁流：进入主页（模糊） -> 输入正确密码 -> 看到解密内容
- [ ] 引用联动流：在 A 卡片引用 B -> 点击 A 中链接 -> 成功定位并显示预览

### 12.4 手动验收清单
- [ ] 视觉稳定性：字体切换（Serif/Sans）是否导致排版塌陷
- [x] 多端适配：移动端下三栏布局是否正确转化为单栏 (已完成)
- [ ] 离线表现：断网时已解锁的内容是否仍可阅读
- [ ] 性能指标：首屏 Streaming 骨架屏是否如期出现

---

## 十三、核心验收标准 (Final UAT)

- [x] 所有 Anthropic 视觉变量完美还原，支持字体实时切换
- [x] 即使在 Network 抓包，也无法在未解锁时看到隐私正文
- [ ] 搜索功能支持关键词与标签组合检索，响应时间 < 200ms
- [x] PWA 安装后支持离线开启

---

## 十四、热力图优化 (Heatmap 2.0)

> **详见规划文档**：`/docs/Heatmap_Optimization_Plan.md`

### 14.1 数据层改造
- [x] 后端接口升级：返回 totalMemos, totalTags, days 统计数据
- [x] 每日数据聚合逻辑优化

### 14.2 UI/UX 升级 (Sidebar)
- [x] 顶部概览：Total Notes / Tags / Days
- [x] 网格重构：固定 7行 x 12列 (最近3个月)
- [x] 交互优化：点击触发 Modal

### 14.3 全量统计模态框 (Modal)
- [x] 模态框基础结构 (shadcn Dialog)
- [x] 年份过滤器与视图切换 (Month/Year Tabs)
- [x] 月视图日历渲染

### 14.4 UI 优化与反馈处理
- [x] 审美升级：Serif 字体与间距优化
- [x] 逻辑修复：Tooltip 定位精准对齐
- [x] 侧边栏增强：实现折叠/展开与宽度动态调整

---

## 统计摘要

| 模块 | 已完成 | 总计 | 完成率 |
|------|--------|------|--------|
| 布局与页面结构 | 4 | 4 | 100% |
| 左侧边栏功能 | 10 | 10 | 100% |
| 右侧区域功能 | 4 | 4 | 100% |
| 中间主区域功能 | 27 | 28 | 96% |
| 登录模块 | 8 | 8 | 100% |
| 管理操作 | 13 | 17 | 76% |
| 安全与隐私架构 | 9 | 14 | 64% |
| 设计系统 | 18 | 18 | 100% |
| 数据库設計 | 14 | 15 | 93% |
| 接口设计 | 15 | 17 | 88% |
| 工程规范 | 11 | 11 | 100% |
| 测试与质量保证 | 3 | 14 | 21% |
| 核心验收标准 | 3 | 4 | 75% |
| **总计** | **139** | **164** | **85%** |

---

## 待完成重点项

### 高优先级（体验与安全优化）
1. **RLS 鉴权规则最终审计**：确保数据库层级的绝对安全
2. **离线解密内容缓存**：提升离线阅读体验

### 中优先级（功能完善）
1. **瀑布流布局**：提升画廊与信息流的视觉层次感
2. **搜索性能优化**：确保响应时间 < 200ms
3. **AI 翻译功能**：支持多语言记录

### 低优先级（测试覆盖）
1. E2E 测试路径覆盖
2. 数据库索引微调

---

*本文档仅用于功能点罗列与进度追踪，具体实现细节请参考 `/docs/modules/` 目录下的各模块文档。*
