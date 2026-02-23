'use server';

export interface LinkMetadata {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string;
    domain: string;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata | null> {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            signal: controller.signal,
            next: { revalidate: 86400 } // Cache for 24 hours
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return { title: null, description: null, image: null, url, domain };
        }

        const html = await response.text();

        // Helper function to extract meta tag content
        const getMetaTag = (html: string, property: string) => {
            const match = html.match(new RegExp(`<meta(?:[^>]+name=["']${property}["'][^>]*content=["']([^"']*)["']|[^>]+content=["']([^"']*)["'][^>]*name=["']${property}["'])`, 'i')) ||
                html.match(new RegExp(`<meta(?:[^>]+property=["']${property}["'][^>]*content=["']([^"']*)["']|[^>]+content=["']([^"']*)["'][^>]*property=["']${property}["'])`, 'i'));
            return match ? (match[1] || match[2]) : null;
        };

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        let title = getMetaTag(html, 'og:title') || getMetaTag(html, 'twitter:title') || (titleMatch ? titleMatch[1] : null);

        // Decode HTML entities
        const decodeEntities = (text: string) => {
            return text.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
        };

        if (title) {
            title = decodeEntities(title.trim());
        }

        let description = getMetaTag(html, 'og:description') || getMetaTag(html, 'twitter:description') || getMetaTag(html, 'description');
        if (description) {
            description = decodeEntities(description.trim());
        }

        let image = getMetaTag(html, 'og:image') || getMetaTag(html, 'twitter:image');

        // Ensure image URL is absolute
        if (image && !image.startsWith('http')) {
            if (image.startsWith('//')) {
                image = urlObj.protocol + image;
            } else if (image.startsWith('/')) {
                image = urlObj.origin + image;
            } else {
                image = urlObj.origin + '/' + image;
            }
        }

        return {
            title,
            description,
            image,
            url,
            domain
        };
    } catch (error) {
        console.error('Failed to fetch link metadata:', error);
        return null;
    }
}
