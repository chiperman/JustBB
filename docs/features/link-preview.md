# 链接解析与丰富卡片预览 (Link Preview)

> 最后更新日期：2026-02-23

## 功能概述
JustMemo 现支持将笔记内容中的普通网址链接（HTTP/HTTPS）自动解析并渲染为类似于 Twitter 卡片的富文本预览面板。通过拉取目标网站的 SEO 信息（Open Graph Meta Tags），为用户提供比单纯文本链接更直观、信息量更丰富的阅读体验。

## 架构逻辑

为了避免前端跨域问题 (CORS) 导致的抓取失败，该功能采用 **Server Action 代理模式**。

1. **内容解析提取阶段**
   * `/src/lib/contentParser.ts`：在解析文本过程末尾，识别未被其他规则命中的有效普通 URL。
   * 为其生成 `type: 'link'` 类型的专用 Token。

2. **服务端抓取阶段**
   * `/src/actions/link-preview.ts`：接收来自前端组件的渲染请求。
   * HTTP Fetch 抓取目标网址，由于性能考虑，超时配置限制为 `5000ms`。
   * 通过正则表达式快速解析提取 `<title>` 标签，及 `og:title`, `og:description`, `og:image` 和 `twitter:` 系列标签，并且解除了 HTML 转义符（如 `&#x27;` / `&quot;`）。
   * 使用了强大的 Next.js 获取缓存 (`next: { revalidate: 86400 }` 即缓存24小时) 来降低代理服务负载并加速后续相同网址的渲染速度。

3. **客户端组件展示阶段**
   * `/src/components/ui/LinkPreview.tsx`：接收 `url` prop。
   * 使用 `IntersectionObserver` 懒加载机制，只有卡片进入浏览器视区（Viewport）时，才会发起 Server Action 抓取请求，极大节省长列表加载消耗。
   * UI 设计遵循现有规范：
      - **加载态 (Loading State)**：展示带有渐变脉冲动画的 Skeleton 骨架屏。
      - **完成态 (Success State)**：渲染卡片主体，包含左侧全填充封面图 `/` 右侧站点标题（最多2行）、摘要描述（最多2行）、Favicon 和域名，高度桌面端一致限定在 `120px`。
      - **异常态 (Error State)**：若服务端抓取异常、超时或是遇到纯文本接口，降级回退显示普通的带图标下划线文本链接，防范展示大面积空白 UI 瑕疵。

## 依赖说明
本功能无需额外引入如 `cheerio` 或 `jsdom` 等重型 HTML 解析器包。利用原生 `fetch` 与轻量正则提取法既满足业务诉求又能保证服务函数的低内存消耗。

组件所使用的默认图标依赖： `@hugeicons/react` 提供的 `Link01Icon`。
Favicon 获取服务利用了稳定的 `https://www.google.com/s2/favicons?domain=...` 代理来解决跨域图片和部分站点由于重定向缺少标准 Favicon `<link>` 的问题。
