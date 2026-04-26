import { describe, expect, it } from 'vitest';
import {
    findPendingMarkupLink,
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

describe('findPendingMarkupLink', () => {
    it('优先匹配当前位置上的 pending URL 节点', () => {
        const doc = {
            descendants: (
                callback: (node: {
                    type: { name: string };
                    attrs: { id?: string; isPending?: boolean };
                }, pos: number) => boolean | void
            ) => {
                const nodes = [
                    { pos: 3, node: { type: { name: 'markupLink' }, attrs: { id: 'https://example.com', isPending: true } } },
                    { pos: 8, node: { type: { name: 'markupLink' }, attrs: { id: 'https://example.com', isPending: true } } },
                ];

                for (const entry of nodes) {
                    if (callback(entry.node, entry.pos) === false) {
                        break;
                    }
                }
            },
        };

        expect(findPendingMarkupLink(doc, { url: 'https://example.com', pos: 8 })).toEqual({ pos: 8 });
    });

    it('当位置变化时会回退到同 URL 的 pending 节点', () => {
        const doc = {
            descendants: (
                callback: (node: {
                    type: { name: string };
                    attrs: { id?: string; isPending?: boolean };
                }, pos: number) => boolean | void
            ) => {
                const nodes = [
                    { pos: 5, node: { type: { name: 'markupLink' }, attrs: { id: 'https://example.com', isPending: true } } },
                    { pos: 9, node: { type: { name: 'markupLink' }, attrs: { id: 'https://other.example.com', isPending: true } } },
                ];

                for (const entry of nodes) {
                    if (callback(entry.node, entry.pos) === false) {
                        break;
                    }
                }
            },
        };

        expect(findPendingMarkupLink(doc, { url: 'https://example.com', pos: 99 })).toEqual({ pos: 5 });
    });

    it('节点已删除时返回 null', () => {
        const doc = {
            descendants: (
                callback: (node: {
                    type: { name: string };
                    attrs: { id?: string; isPending?: boolean };
                }, pos: number) => boolean | void
            ) => {
                const nodes = [
                    { pos: 4, node: { type: { name: 'markupLink' }, attrs: { id: 'https://example.com', isPending: false } } },
                    { pos: 7, node: { type: { name: 'paragraph' }, attrs: {} } },
                ];

                for (const entry of nodes) {
                    if (callback(entry.node, entry.pos) === false) {
                        break;
                    }
                }
            },
        };

        expect(findPendingMarkupLink(doc, { url: 'https://example.com', pos: 4 })).toBeNull();
    });
});
