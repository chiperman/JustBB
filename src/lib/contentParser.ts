export type ContentToken =
    | { type: 'text'; value: string }
    | { type: 'tag'; value: string }
    | { type: 'ref'; value: string }
    | { type: 'image'; value: string };

export function parseContentTokens(text: string): ContentToken[] {
    // 包含三种匹配模式：
    // 1. Tag匹配: #标签 (不含空格，中文或字母数字)
    // 2. 引用匹配: @数字 
    // 3. 图片直链: http(s)://...jpg/png/gif/webp
    const regex = /(@\d+)|(#[\w\u4e00-\u9fa5]+)|(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp))/g;

    const tokens: ContentToken[] = [];
    let lastIndex = 0;

    text.replace(regex, (match, atRef, hashTag, imgUrl, index) => {
        // 添加匹配前的纯文本
        if (index > lastIndex) {
            tokens.push({ type: 'text', value: text.slice(lastIndex, index) });
        }

        if (atRef) {
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
