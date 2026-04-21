'use client';

import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { PluginKey } from '@tiptap/pm/state';
import { parseContentTokens } from '@/lib/contentParser';
import { CustomSuggestionProps } from '../../hooks/useEditorSuggestions';
import {
    escapeHtml,
    formatSmartLinkToken,
    serializeSmartLinkHtml,
} from './smartLink';

export const mentionPluginKey = new PluginKey('mention');
export const hashtagPluginKey = new PluginKey('hashtag');

import { ReactNodeViewRenderer } from '@tiptap/react';
import { LinkNodeView } from './LinkNodeView';

// 辅助函数，将纯文本转换为 Tiptap 能识别的 HTML 格式
export function textToTiptapHtml(text: string): string {
    if (!text) return '';

    return text.split('\n').map(line => {
        if (!line.trim()) return '<p></p>';

        const tokens = parseContentTokens(line);
        const html = tokens.map(token => {
            switch (token.type) {
                case 'tag':
                    const tagName = token.value.slice(1);
                    return `<span data-type="hashtag" data-id="${escapeHtml(tagName)}" data-label="${escapeHtml(tagName)}">#${escapeHtml(tagName)}</span>`;
                case 'ref':
                    const memoNum = token.value.slice(1);
                    return `<span data-type="mention" data-id="${escapeHtml(memoNum)}" data-label="${escapeHtml(memoNum)}">@${escapeHtml(memoNum)}</span>`;
                case 'markupLink':
                    return serializeSmartLinkHtml({
                        title: token.title,
                        url: token.url,
                        mode: token.mode,
                        isPending: (token as { isPending?: boolean }).isPending,
                    });
                case 'text':
                    return escapeHtml(token.value);
                default:
                    return token.value;
            }
        }).join('');

        return `<p>${html}</p>`;
    }).join('');
}

interface ExtensionOptions {
    onMentionStart: (props: CustomSuggestionProps) => void;
    onMentionUpdate: (props: CustomSuggestionProps) => void;
    onMentionExit: () => void;
    onMentionKeyDown: (props: { event: KeyboardEvent }) => boolean;
    onHashtagStart: (props: CustomSuggestionProps) => void;
    onHashtagUpdate: (props: CustomSuggestionProps) => void;
    onHashtagExit: () => void;
    onHashtagKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const getExtensions = (options: ExtensionOptions) => [
    StarterKit.configure({
        heading: false,
        codeBlock: false,
        bold: false,
        italic: false,
    }),
    Mention.extend({
        name: 'mention',
        parseHTML() {
            return [{ tag: 'span[data-type="mention"]' }]
        },
        renderHTML({ node }) {
            return ['span', this.options.HTMLAttributes, `@${node.attrs.label ?? node.attrs.id}`]
        },
    }).configure({
        HTMLAttributes: {
            class: 'text-primary font-mono bg-primary/10 px-1 rounded-md mx-0.5 inline-block decoration-none',
        },
        suggestion: {
            char: '@',
            pluginKey: mentionPluginKey,
            render: () => ({
                onStart: options.onMentionStart,
                onUpdate: options.onMentionUpdate,
                onExit: options.onMentionExit,
                onKeyDown: options.onMentionKeyDown,
            }),
        },
    }),
    Mention.extend({
        name: 'hashtag',
        parseHTML() {
            return [{ tag: 'span[data-type="hashtag"]' }]
        },
        renderHTML({ node }) {
            return ['span', this.options.HTMLAttributes, `#${node.attrs.label ?? node.attrs.id}`]
        },
    }).configure({
        HTMLAttributes: {
            class: 'font-mono mx-0.5 inline-block decoration-none font-medium',
            style: 'color: #5783f7',
        },
        suggestion: {
            char: '#',
            pluginKey: hashtagPluginKey,
            allowSpaces: false,
            allow: () => true,
            render: () => ({
                onStart: options.onHashtagStart,
                onUpdate: options.onHashtagUpdate,
                onExit: options.onHashtagExit,
                onKeyDown: options.onHashtagKeyDown,
            }),
        },
    }),
    Mention.extend({
        name: 'markupLink',
        addAttributes() {
            return {
                ...this.parent?.(),
                mode: {
                    default: 'mention',
                    parseHTML: element => element.getAttribute('data-mode') || 'mention',
                    renderHTML: attributes => ({ 'data-mode': attributes.mode }),
                },
                isPending: {
                    default: false,
                    parseHTML: element => element.getAttribute('data-pending') === 'true',
                    renderHTML: attributes => attributes.isPending ? { 'data-pending': 'true' } : {},
                },
            }
        },
        parseHTML() {
            return [{ tag: 'span[data-type="markupLink"]' }]
        },
        renderHTML({ node }) {
            return ['span', this.options.HTMLAttributes, formatSmartLinkToken({
                title: node.attrs.label ?? '链接',
                url: node.attrs.id,
                mode: node.attrs.mode,
            })]
        },
        addNodeView() {
            return ReactNodeViewRenderer(LinkNodeView)
        },
        renderText({ node }) {
            return formatSmartLinkToken({
                title: node.attrs.label ?? '链接',
                url: node.attrs.id,
                mode: node.attrs.mode,
            });
        },
    }).configure({
        HTMLAttributes: {
            class: 'markup-link-node',
        },
        suggestion: {
            char: '🔗',
            pluginKey: new PluginKey('markupLink'),
            render: () => ({}),
        },
    }),
    LinkExtension.configure({
        openOnClick: false,
    }),
];
