import { describe, expect, it } from 'vitest';
import {
    formatSmartLinkToken,
    replaceSmartLinkToken,
    type LinkRenderMode,
} from './smartLink';

describe('replaceSmartLinkToken', () => {
    it.each<LinkRenderMode>(['mention', 'pill', 'card'])(
        '保留 %s 模式并替换原始 token',
        (mode) => {
            const docText = `before ${formatSmartLinkToken({
                title: 'Old Title',
                url: 'https://old.example.com',
                mode,
            })} after`;

            const updated = replaceSmartLinkToken(
                docText,
                {
                    title: 'Old Title',
                    url: 'https://old.example.com',
                    mode,
                },
                {
                    title: 'New Title',
                    url: 'https://new.example.com',
                }
            );

            expect(updated).toBe(
                `before ${formatSmartLinkToken({
                    title: 'New Title',
                    url: 'https://new.example.com',
                    mode,
                })} after`
            );
        }
    );

    it('mode 不匹配时不替换错误 token', () => {
        const docText = formatSmartLinkToken({
            title: 'Old Title',
            url: 'https://old.example.com',
            mode: 'card',
        });

        const updated = replaceSmartLinkToken(
            docText,
            {
                title: 'Old Title',
                url: 'https://old.example.com',
                mode: 'mention',
            },
            {
                title: 'New Title',
                url: 'https://new.example.com',
            }
        );

        expect(updated).toBeNull();
    });
});
