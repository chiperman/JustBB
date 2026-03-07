export type ContentToken =
    | { type: 'text'; value: string }
    | { type: 'tag'; value: string }
    | { type: 'ref'; value: string }
    | { type: 'image'; value: string }
    | { type: 'code'; value: string; lang?: string }
    | { type: 'location'; value: string; name: string; lat: number; lng: number }
    | { type: 'email'; value: string }
    | { type: 'link'; value: string };

export function parseContentTokens(text: string): ContentToken[] {
    // 包含六种匹配模式，注意顺序，代码块优先：
    // 1. 代码块: ```lang ... ```
    // 2. 定位标记: 📍[地名](纬度,经度)
    // 3. Markdown 图片: ![alt](url)
    // 4. 引用匹配: @数字 
    // 5. Tag匹配: #标签 (不含空格，中文或字母数字)
    // 6. Email匹配: test@example.com
    // 7. 图片直链: http(s)://...jpg/png/gif/webp

    // 预处理：移除异常的调试用标签 (如 < a id=0 >, < span id=1 >)
    // 这些可能是历史数据中混入的 React/DevTools 调试残留
    const cleanText = text.replace(/<\s*(?:a|span)\s+id=\d+\s*>/g, '').replace(/<\s*\/\s*(?:a|span)\s*>/g, '');

    // ─── 子模式定义 ────────────────────────────
    const PATTERNS = {
        codeBlock: /```(\w*)\n?([\s\S]*?)```/,
        location: /📍\[([^\]]+)\]\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/,
        mdImage: /!\[.*?\]\((https?:\/\/[a-zA-Z0-9\-._~:\/?#\[\]@!$&'()*+,;=%]+\.(?:jpg|jpeg|png|gif|webp))\)/,
        ref: /(@\d+)/,
        tag: /(?<=^|\s|[^a-zA-Z0-9])(#[\w\u4e00-\u9fa5]+)/,
        email: /([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/,
        rawImage: /(https?:\/\/[a-zA-Z0-9\-._~:\/?#\[\]@!$&'()*+,;=%]+\.(?:jpg|jpeg|png|gif|webp))/,
        link: /(https?:\/\/[^\s\u4e00-\u9fa5<]+[^\s\u4e00-\u9fa5<.,;:!?'"”’。，！？）】])/,
    } as const;

    // 按优先级组合（代码块 > 定位 > 图片 > 引用 > 标签 > 邮件 > 链接）
    const regex = new RegExp(
        Object.values(PATTERNS).map(p => p.source).join('|'),
        'g'
    );

    const tokens: ContentToken[] = [];
    let lastIndex = 0;

    cleanText.replace(regex, (match, lang, codeContent, locName, locLat, locLng, mdImgUrl, atRef, hashTag, email, rawImgUrl, rawLink, index) => {
        // 添加匹配前的纯文本
        if (index > lastIndex) {
            tokens.push({ type: 'text', value: cleanText.slice(lastIndex, index) });
        }

        if (codeContent !== undefined) {
            tokens.push({ type: 'code', value: codeContent, lang: lang || 'text' });
        } else if (locName !== undefined) {
            tokens.push({ type: 'location', value: match, name: locName, lat: parseFloat(locLat), lng: parseFloat(locLng) });
        } else if (mdImgUrl) {
            tokens.push({ type: 'image', value: mdImgUrl });
        } else if (atRef) {
            tokens.push({ type: 'ref', value: atRef });
        } else if (hashTag) {
            tokens.push({ type: 'tag', value: hashTag });
        } else if (email) {
            tokens.push({ type: 'email', value: email });
        } else if (rawImgUrl) {
            tokens.push({ type: 'image', value: rawImgUrl });
        } else if (rawLink) {
            tokens.push({ type: 'link', value: rawLink });
        }

        lastIndex = index + match.length;
        return match;
    });

    // 添加剩余文本
    if (lastIndex < cleanText.length) {
        tokens.push({ type: 'text', value: cleanText.slice(lastIndex) });
    }

    return tokens;
}
