/**
 * 笔记内容解析工具类
 * 负责从 Markdown 文本中提取标签、定位信息及统计字数
 */

export interface Location {
    name: string;
    lat: number;
    lng: number;
}

/**
 * 从文本中提取 #标签
 */
export function extractTags(content: string): string[] {
    const tagRegex = /#([\w\u4e00-\u9fa5]+)/g;
    const tags = new Set<string>();
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
        tags.add(match[1]);
    }
    return Array.from(tags);
}

/**
 * 从文本中提取定位信息 📍[名称](lat, lng)
 */
export function extractLocations(content: string): Location[] {
    const locationRegex = /📍\[([^\]]+)\]\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/g;
    const locations: Location[] = [];
    let match;
    while ((match = locationRegex.exec(content)) !== null) {
        locations.push({
            name: match[1],
            lat: parseFloat(match[2]),
            lng: parseFloat(match[3]),
        });
    }
    return locations;
}

/**
 * 计算字数（去除首尾空格）
 */
export function calculateWordCount(content: string): number {
    return content.trim().length;
}
