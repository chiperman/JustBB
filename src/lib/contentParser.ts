export type ContentToken =
    | { type: 'text'; value: string }
    | { type: 'tag'; value: string }
    | { type: 'ref'; value: string }
    | { type: 'image'; value: string }
    | { type: 'code'; value: string; lang?: string };

export function parseContentTokens(text: string): ContentToken[] {
    // 包含四种匹配模式，注意顺序，代码块优先：
    // 1. 代码块: ```lang ... ```
    // 2. 引用匹配: @数字 
    // 3. Tag匹配: #标签 (不含空格，中文或字母数字)
    // 4. 图片直链: http(s)://...jpg/png/gif/webp
    // 5. Explicit Markdown Image: ![...](...) - handled by separate logic or added here? 
    //    Current MemoContent handles explicit images separately or assume user types raw URL? 
    //    Existing code handled raw URLs.
    //    Let's add code block support first.

    // Regex explanation:
    // Group 1 (lang) & 2 (content): ```(\w*)\n?([\s\S]*?)```
    // Group 3: @\d+
    // Group 4: #tag
    // Group 5: http...
    const regex = /```(\w*)\n?([\s\S]*?)```|(@\d+)|(#[\w\u4e00-\u9fa5]+)|(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp))/g;

    const tokens: ContentToken[] = [];
    let lastIndex = 0;

    text.replace(regex, (match, lang, codeContent, atRef, hashTag, imgUrl, index) => {
        // 添加匹配前的纯文本
        if (index > lastIndex) {
            tokens.push({ type: 'text', value: text.slice(lastIndex, index) });
        }

        if (codeContent !== undefined) {
            tokens.push({ type: 'code', value: codeContent, lang: lang || 'text' });
        } else if (atRef) {
            tokens.push({ type: 'ref', value: atRef });
        } else if (hashTag) {
            tokens.push({ type: 'tag', value: hashTag });
        } else if (imgUrl) {
            tokens.push({ type: 'image', value: imgUrl });
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
