export type ContentToken =
    | { type: 'text'; value: string }
    | { type: 'tag'; value: string }
    | { type: 'ref'; value: string }
    | { type: 'image'; value: string }
    | { type: 'code'; value: string; lang?: string };

export function parseContentTokens(text: string): ContentToken[] {
    // 包含五种匹配模式，注意顺序，代码块优先：
    // 1. 代码块: ```lang ... ```
    // 2. Markdown 图片: ![alt](url)
    // 3. 引用匹配: @数字 
    // 4. Tag匹配: #标签 (不含空格，中文或字母数字)
    // 5. 图片直链: http(s)://...jpg/png/gif/webp

    const regex = /```(\w*)\n?([\s\S]*?)```|!\[.*?\]\((https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp))\)|(@\d+)|(?:^|\s|(?<=[^a-zA-Z0-9]))(#[\w\u4e00-\u9fa5]+)|(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp))/g;

    const tokens: ContentToken[] = [];
    let lastIndex = 0;

    text.replace(regex, (match, lang, codeContent, mdImgUrl, atRef, hashTag, rawImgUrl, index) => {
        // 添加匹配前的纯文本
        if (index > lastIndex) {
            tokens.push({ type: 'text', value: text.slice(lastIndex, index) });
        }

        if (codeContent !== undefined) {
            tokens.push({ type: 'code', value: codeContent, lang: lang || 'text' });
        } else if (mdImgUrl) {
            tokens.push({ type: 'image', value: mdImgUrl });
        } else if (atRef) {
            tokens.push({ type: 'ref', value: atRef });
        } else if (hashTag) {
            tokens.push({ type: 'tag', value: hashTag });
        } else if (rawImgUrl) {
            tokens.push({ type: 'image', value: rawImgUrl });
        }

        lastIndex = index + match.length;
        return match;
    });

    // 添加剩余文本
    if (lastIndex < text.length) {
        tokens.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return tokens;
}
