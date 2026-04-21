import { describe, expect, it } from 'vitest';
import { textToTiptapHtml } from './extensions';

describe('textToTiptapHtml', () => {
    it('会对 smart-link 的标题和 URL 做 HTML 转义', () => {
        const html = textToTiptapHtml(
            '🔗[Fish & "Chips" <Menu>](https://example.com?q=fish&lang=zh|card)'
        );

        expect(html).toContain('data-type="markupLink"');
        expect(html).toContain('data-mode="card"');
        expect(html).toContain('data-label="Fish &amp; &quot;Chips&quot; &lt;Menu&gt;"');
        expect(html).toContain('data-id="https://example.com?q=fish&amp;lang=zh"');
        expect(html).toContain(
            '🔗[Fish &amp; &quot;Chips&quot; &lt;Menu&gt;](https://example.com?q=fish&amp;lang=zh|card)'
        );
        expect(html).not.toContain('data-label="Fish & "Chips" <Menu>"');
    });
});
