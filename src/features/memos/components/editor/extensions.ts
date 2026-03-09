'use client';

import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { PluginKey } from '@tiptap/pm/state';
import { parseContentTokens } from '@/lib/contentParser';
import { CustomSuggestionProps } from '../../hooks/useEditorSuggestions';

export const mentionPluginKey = new PluginKey('mention');
export const hashtagPluginKey = new PluginKey('hashtag');

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
                    return `<span data-type="hashtag" data-id="${tagName}" data-label="${tagName}">#${tagName}</span>`;
                case 'ref':
                    const memoNum = token.value.slice(1);
                    return `<span data-type="mention" data-id="${memoNum}" data-label="${memoNum}">@${memoNum}</span>`;
                case 'text':
                    return token.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    Placeholder.configure({
        placeholder: 'Wanna memo something? JustMemo it!',
        emptyEditorClass: 'is-editor-empty',
    }),
    LinkExtension.configure({
        openOnClick: false,
    }),
];
