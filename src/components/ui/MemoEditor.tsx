'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createMemo } from '@/actions/memos';
import { useRouter } from 'next/navigation';
import { X, Pin, Lock, LockOpen, Hash, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { updateMemoContent } from '@/actions/update';
import { getAllMemos } from '@/actions/search';
import { Command, CommandList, CommandItem, CommandEmpty, CommandGroup } from './command';
import { getAllTags } from '@/actions/tags';
import { useTags } from '@/context/TagsContext';
import { useStats } from '@/context/StatsContext';
import { memoCache, CacheItem } from '@/lib/memo-cache'; // Import local cache

// Tiptap imports
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { nodeInputRule, nodePasteRule } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';

import { PluginKey, Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

// 为建议插件定义独立的 Key，防止冲突
const mentionPluginKey = new PluginKey('mention');
const hashtagPluginKey = new PluginKey('hashtag');

// 建议项类型
interface SuggestionItem {
    id: string;
    label: string;
    subLabel?: string;
    count?: number;
    memo_number?: number;
    created_at?: string;
}
import { useReducedMotion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { AnimatePresence, motion } from 'framer-motion';

import { Memo, TagStat } from '@/types/memo';
import { Editor } from '@tiptap/react';

import { SuggestionProps } from '@tiptap/suggestion';

interface CustomSuggestionProps extends SuggestionProps {
    command: (props: any) => void;
}


// Helper to generate smart snippet
const generateSnippet = (content: string, query: string): string => {
    // 1. Replace Markdown images with [图片]
    const text = content.replace(/!\[.*?\]\(.*?\)/g, '[图片]');

    // 2. Initial toggle if no query
    if (!query.trim()) return text.substring(0, 100);

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    // 3. If query not found (shouldn't happen in search results, but safe guard)
    if (index === -1) return text.substring(0, 100);

    // 4. If match is near the beginning, just show start
    if (index < 40) return text.substring(0, 100);

    // 5. Contextual snippet
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + 80);
    return '...' + text.substring(start, end);
};

interface MemoEditorProps {
    mode?: 'create' | 'edit';
    memo?: Memo;
    onCancel?: () => void;
    onSuccess?: () => void;
    isCollapsed?: boolean;
    hideFullscreen?: boolean;
    contextMemos?: Memo[]; // 增加上下文 Memos 用于即时搜索
}

export function MemoEditor({ mode = 'create', memo, onCancel, onSuccess, isCollapsed: isPropCollapsed = false, hideFullscreen = false, contextMemos = [] }: MemoEditorProps) {
    const { refreshTags } = useTags();
    const { refreshStats } = useStats();
    const [content, setContent] = useState(memo?.content || '');
    const [tags, setTags] = useState<string[]>(memo?.tags || []);
    const [isPending, setIsPending] = useState(false);
    const [isPrivate, setIsPrivate] = useState(memo?.is_private || false);
    const [accessCode, setAccessCode] = useState('');
    const [accessHint, setAccessHint] = useState('');
    const [isPinned, setIsPinned] = useState(memo?.is_pinned || false);
    const [error, setError] = useState<string | null>(null);
    const [showPrivateDialog, setShowPrivateDialog] = useState(false);
    const [showAccessCode, setShowAccessCode] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // 计算最终是否收缩：属性要求收缩 且 未获得焦点 且 为创建模式 且 内容为空或未改变原始内容（或者强制收缩）
    const isActuallyCollapsed = isPropCollapsed && !isFocused && mode === 'create';

    // Suggestion system states
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionQuery, setMentionQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasMoreMentions, setHasMoreMentions] = useState(true);

    // Refs for Tiptap closures
    const suggestionsRef = useRef<SuggestionItem[]>([]);
    const selectedIndexRef = useRef(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestionPropsRef = useRef<any>(null);
    const lastRequestIdRef = useRef(0);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingMoreRef = useRef(false);
    const hasMoreMentionsRef = useRef(true);
    const mentionOffsetRef = useRef(0);
    const mentionQueryRef = useRef('');

    useEffect(() => {
        suggestionsRef.current = suggestions;
    }, [suggestions]);

    useEffect(() => {
        selectedIndexRef.current = selectedIndex;
    }, [selectedIndex]);

    useEffect(() => {
        hasMoreMentionsRef.current = hasMoreMentions;
    }, [hasMoreMentions]);

    useEffect(() => {
        mentionQueryRef.current = mentionQuery;
    }, [mentionQuery]);

    const [allTags, setAllTags] = useState<TagStat[]>([]);
    const allTagsRef = useRef<TagStat[]>([]);

    useEffect(() => {
        allTagsRef.current = allTags;
    }, [allTags]);



    // Local pagination state
    const [filteredMentions, setFilteredMentions] = useState<SuggestionItem[]>([]);
    const [displayLimit, setDisplayLimit] = useState(20); // Initial limit changed to 20 per plan
    const [suggestionTrigger, setSuggestionTrigger] = useState<string | null>(null);
    const [isIndexLoading, setIsIndexLoading] = useState(true);
    const [suggestionPosition, setSuggestionPosition] = useState<{ top: number; left: number } | null>(null);
    const filteredMentionsRef = useRef<SuggestionItem[]>([]);
    const suggestionTriggerRef = useRef<string | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const relativeGroupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        suggestionTriggerRef.current = suggestionTrigger;
    }, [suggestionTrigger]);

    useEffect(() => {
        filteredMentionsRef.current = filteredMentions;
        // Only update suggestions from pagination state if the active trigger is '@'
        if (showSuggestions && suggestionTrigger === '@') {
            setSuggestions(filteredMentions.slice(0, displayLimit));
            setHasMoreMentions(displayLimit < filteredMentions.length);
        }
    }, [filteredMentions, displayLimit, showSuggestions, suggestionTrigger]);

    useEffect(() => {
        // Initialize Cache Strategy
        const initCache = async () => {
            setIsIndexLoading(true);

            // 1. Immediate Seed from props (if any and cache empty)
            if (!memoCache.getInitialized() && contextMemos.length > 0) {
                const seedItems: CacheItem[] = contextMemos.map(m => ({
                    id: m.id,
                    memo_number: m.memo_number || 0,
                    content: m.content,
                    created_at: m.created_at
                }));
                memoCache.mergeItems(seedItems);
            }

            // 2. Background Fetch Full Index
            if (!memoCache.getFullyLoaded()) {
                try {
                    const memos = await getAllMemos();

                    const indexItems: CacheItem[] = memos.map(m => ({
                        id: m.id!,
                        memo_number: m.memo_number || 0,
                        content: m.content || '',
                        created_at: m.created_at || new Date().toISOString()
                    }));
                    memoCache.mergeItems(indexItems);
                    memoCache.setFullyLoaded(true);

                    // If the user is currently looking at mentions, refresh the list immediately
                    if (suggestionTriggerRef.current === '@') {
                        fetchMentionSuggestions(mentionQueryRef.current, true);
                    }
                } catch (e) {
                    console.error("Failed to fetch background index", e);
                }
            }

            setIsIndexLoading(false);
        };

        initCache();
    }, []);

    // --- 提取搜索逻辑 ---
    // Update: Now using purely local index
    // --- 提取搜索逻辑 ---
    // Update: Now using global memoCache
    const fetchMentionSuggestions = async (query: string, isUpdate = false) => {
        setMentionQuery(query);
        setSelectedIndex(0);

        // Search in local cache
        const searchResults = memoCache.search(query);

        // Map to SuggestionItem with Smart Snippet
        const filtered: SuggestionItem[] = searchResults.map(item => ({
            id: item.id,
            label: `@${item.memo_number}`,
            subLabel: generateSnippet(item.content, query),
            memo_number: item.memo_number,
            created_at: item.created_at
        }));

        // Update filtered results and reset pagination
        setFilteredMentions(filtered); // Store FULL list of matches
        setDisplayLimit(20); // Reset limit to 20 for instant render
        setIsLoading(false);
    };

    const fetchHashtagSuggestions = (query: string) => {
        setMentionQuery(query);
        setSelectedIndex(0);



        const filtered = allTagsRef.current
            .filter((t: TagStat) => t.tag_name.toLowerCase().includes(query.toLowerCase()))
            .sort((a, b) => (b.count || 0) - (a.count || 0))
            .map((t: TagStat) => ({
                id: t.tag_name,
                label: `#${t.tag_name}`,
                count: t.count
            }));

        setHasMoreMentions(false); // 正在显示标签，禁用 mention 的加载更多
        setSuggestions(filtered);
    };

    useEffect(() => {
        mentionQueryRef.current = mentionQuery;
    }, [mentionQuery]);

    const shouldReduceMotion = useReducedMotion();
    const router = useRouter();
    useEffect(() => {
        getAllTags().then(setAllTags);
    }, []);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: false,
                codeBlock: false,
                bold: false,
                italic: false,
            }),
            Mention.extend({
                name: 'mention',
                renderHTML({ node, HTMLAttributes }) {
                    return [
                        'span',
                        this.options.HTMLAttributes,
                        `@${node.attrs.label ?? node.attrs.id}`,
                    ]
                },
            }).configure({
                HTMLAttributes: {
                    class: 'text-primary font-mono bg-primary/10 px-1 rounded-sm mx-0.5 inline-block decoration-none',
                },
                suggestion: {
                    char: '@',
                    pluginKey: mentionPluginKey,
                    render: () => {
                        const updatePosition = (props: any) => {
                            const rect = props.clientRect?.();
                            if (rect && relativeGroupRef.current) {
                                const parentRect = relativeGroupRef.current.getBoundingClientRect();

                                // Calculate top/left relative to our outer relative container
                                // Use rect.bottom (viewport bottom) - parentRect.top (viewport top)
                                let left = rect.left - parentRect.left;
                                let top = rect.bottom - parentRect.top + 8; // Added 8px offset

                                // Prevent overflow on the right
                                const maxLeft = parentRect.width - 370; // 350px width + buffer
                                if (left > maxLeft) left = maxLeft;
                                if (left < 0) left = 10;

                                setSuggestionPosition({ top, left });
                            }
                        };

                        return {
                            onStart: (props) => {
                                suggestionPropsRef.current = props;
                                setShowSuggestions(true);
                                setSuggestionTrigger('@');
                                fetchMentionSuggestions(props.query, false);
                                updatePosition(props);
                            },
                            onUpdate: (props) => {
                                suggestionPropsRef.current = props;
                                fetchMentionSuggestions(props.query, true);
                                updatePosition(props);
                            },
                            onExit: () => {
                                setShowSuggestions(false);
                                setSuggestionTrigger(null);
                                suggestionPropsRef.current = null;
                            },
                            onKeyDown: (props) => {
                                if (props.event.key === 'Escape') {
                                    setShowSuggestions(false);
                                    return true;
                                }

                                if (props.event.key === ' ' && suggestionPropsRef.current) {
                                    // 按下空格，若查询符合 @\d+ 格式，直接创建
                                    const query = suggestionPropsRef.current.query;
                                    if (/^\d+$/.test(query)) {
                                        suggestionPropsRef.current.command({ id: query, label: query });
                                        props.event.preventDefault();
                                        return true;
                                    }
                                }

                                if (props.event.key === 'ArrowUp') {
                                    setSelectedIndex((prev) => (prev + suggestionsRef.current.length - 1) % suggestionsRef.current.length);
                                    props.event.preventDefault();
                                    return true;
                                }

                                if (props.event.key === 'ArrowDown') {
                                    setSelectedIndex((prev) => (prev + 1) % suggestionsRef.current.length);
                                    props.event.preventDefault();
                                    return true;
                                }

                                if (props.event.key === 'Enter') {
                                    const item = suggestionsRef.current[selectedIndexRef.current];
                                    if (item && suggestionPropsRef.current) {
                                        // 移除 @ 前缀再插入，避免 renderHTML 重复添加
                                        const label = item.label.startsWith('@') ? item.label.slice(1) : item.label;
                                        suggestionPropsRef.current.command({ id: label, label: label });
                                        props.event.preventDefault();
                                        props.event.stopPropagation();
                                        return true;
                                    }
                                }

                                return false;
                            },
                        };
                    },
                },
            }),
            Mention.extend({
                name: 'hashtag',
                renderHTML({ node, HTMLAttributes }) {
                    return [
                        'span',
                        this.options.HTMLAttributes,
                        `#${node.attrs.label ?? node.attrs.id}`,
                    ]
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
                    // 自定义匹配规则以支持中文等非 ASCII 字符
                    // 这里允许 # 后跟任意非空格字符
                    allow: ({ editor, range }) => {
                        return true;
                    },
                    render: () => {
                        const updatePosition = (props: any) => {
                            const rect = props.clientRect?.();
                            if (rect && relativeGroupRef.current) {
                                const parentRect = relativeGroupRef.current.getBoundingClientRect();

                                // Calculate top/left relative to our outer relative container
                                let left = rect.left - parentRect.left;
                                let top = rect.bottom - parentRect.top + 8; // Added 8px offset

                                // Prevent overflow on the right
                                const maxLeft = parentRect.width - 370; // 350px width + buffer
                                if (left > maxLeft) left = maxLeft;
                                if (left < 0) left = 10;

                                setSuggestionPosition({ top, left });
                            }
                        };

                        return {
                            onStart: (props) => {
                                suggestionPropsRef.current = props;
                                setShowSuggestions(true);
                                setSuggestionTrigger('#');
                                fetchHashtagSuggestions(props.query);
                                updatePosition(props);
                            },
                            onUpdate: (props) => {
                                suggestionPropsRef.current = props;
                                fetchHashtagSuggestions(props.query);
                                updatePosition(props);
                            }, onExit: () => {
                                setShowSuggestions(false);
                                setSuggestionTrigger(null);
                                suggestionPropsRef.current = null;
                            },
                            onKeyDown: (props) => {
                                if (props.event.key === 'Escape') {
                                    setShowSuggestions(false);
                                    return true;
                                }

                                if (props.event.key === ' ' && suggestionPropsRef.current) {
                                    // 按下空格，若查询符合标签格式，直接创建
                                    const query = suggestionPropsRef.current.query;
                                    if (/^[\w\u4e00-\u9fa5]+$/.test(query)) {
                                        suggestionPropsRef.current.command({ id: query, label: query });
                                        props.event.preventDefault();
                                        return true;
                                    }
                                }

                                if (props.event.key === 'ArrowUp') {
                                    setSelectedIndex((prev) => (prev + suggestionsRef.current.length - 1) % suggestionsRef.current.length);
                                    props.event.preventDefault();
                                    return true;
                                }

                                if (props.event.key === 'ArrowDown') {
                                    setSelectedIndex((prev) => (prev + 1) % suggestionsRef.current.length);
                                    props.event.preventDefault();
                                    return true;
                                }

                                if (props.event.key === 'Enter') {
                                    const item = suggestionsRef.current[selectedIndexRef.current];
                                    if (suggestionPropsRef.current && item) {
                                        const rawLabel = item ? item.label : `#${suggestionPropsRef.current.query}`;
                                        // 移除 # 前缀
                                        const label = rawLabel.startsWith('#') ? rawLabel.slice(1) : rawLabel;
                                        suggestionPropsRef.current.command({ id: label, label: label });
                                        props.event.preventDefault();
                                        props.event.stopPropagation();
                                        return true;
                                    }
                                }

                                return false;
                            },
                        };
                    },
                },
            }),
            Placeholder.configure({
                placeholder: 'Wanna memo something? JustMemo it!',
                emptyEditorClass: 'is-editor-empty',
            }),
            LinkExtension.configure({
                openOnClick: false,
            }),

        ],
        content: memo?.content || '',
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            setContent(text);
            setError(null);

            // 实时同步内容中的标签到 tags 状态
            // 采用正则从纯文本中提取，确保即使未转换为 Node 的标签也能被识别
            // 改进正则以支持中文和中英文混合标签，并确保不匹配邮箱等
            const hashtagRegex = /(?:^|\s|(?<=[^a-zA-Z0-9]))#([\w\u4e00-\u9fa5]+)/g;
            const matches = text.matchAll(hashtagRegex);
            const extractedTags = Array.from(new Set(Array.from(matches).map(m => m[1])));
            setTags(extractedTags);
        },
        onFocus: () => {
            setIsFocused(true);
            // 重新进入编辑器时，检查是否需要重新弹出建议
            setTimeout(() => {
                if (!editor) return;
                const { from } = editor.state.selection;
                // 获取光标前后的文本进行判断
                const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from);
                const mentionMatch = textBefore.match(/(?:^|\s)(@|#)(\w*)$/);

                if (mentionMatch) {
                    const char = mentionMatch[1];
                    const query = mentionMatch[2];
                    const startPos = from - mentionMatch[2].length - 1;

                    // 手动计算 range 并模拟 props 供 handleSelectSuggestion 使用
                    suggestionPropsRef.current = {
                        editor,
                        query,
                        range: { from: startPos, to: from },
                        command: (props: { label: string }) => {
                            // 手动实现插入逻辑
                            editor.chain().focus().deleteRange({ from: startPos, to: from }).insertContent([
                                {
                                    type: char === '@' ? 'mention' : 'hashtag',
                                    attrs: { id: props.label, label: props.label }
                                },
                                {
                                    type: 'text',
                                    text: ' '
                                }
                            ]).run();
                        }
                    };

                    setShowSuggestions(true);
                    setSuggestionTrigger(char);
                    if (char === '@') {
                        fetchMentionSuggestions(query, false);
                    } else {
                        fetchHashtagSuggestions(query);
                    }
                }
            }, 100);
        },
        onBlur: () => {
            setIsFocused(false);
            setShowSuggestions(false);
            setSuggestionTrigger(null);
        },
        editorProps: {
            attributes: {
                class: cn(
                    "tiptap prose prose-sm max-w-none focus:outline-none text-foreground/80 leading-relaxed font-sans tracking-normal",
                    hideFullscreen ? "flex-1 h-full overflow-y-auto scrollbar-hover px-1 focus:outline-none" : "min-h-[120px]",
                    isActuallyCollapsed ? "min-h-[24px]" : "min-h-[120px]",
                    "text-base"
                ),
            },
        },
    });

    useEffect(() => {
        if (editor && memo?.content && mode === 'edit') {
            editor.commands.setContent(memo.content);
        }
    }, [editor, memo, mode]);

    const suggestionListRef = useRef<HTMLUListElement>(null);

    useLayoutEffect(() => {
        if (showSuggestions && suggestionListRef.current) {
            const selectedItem = suggestionListRef.current.children[selectedIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({
                    block: 'nearest',
                    behavior: 'instant' // 避免快速操作时的平滑滚动延迟导致“抽搐”
                });
            }
        }
    }, [selectedIndex, showSuggestions]);

    const handleSuggestionScroll = async (e: React.UIEvent<HTMLUListElement>) => {
        const target = e.currentTarget;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 150;

        // Local infinite scroll: increase limit when scrolling down
        if (isNearBottom && hasMoreMentions && !isLoading) {
            setDisplayLimit(prev => Math.min(prev + 20, filteredMentionsRef.current.length));
        }
    };

    const handleSelectSuggestion = (item: SuggestionItem) => {
        if (!editor) return;


        if (suggestionPropsRef.current) {
            const rawLabel = item.label;
            // 根据当前的触发字符判断应该移除哪个前缀
            // 这里我们无法直接知道当前是 @ 还是 #，但可以通过 label 判断
            let label = rawLabel;
            if (rawLabel.startsWith('@') || rawLabel.startsWith('#')) {
                label = rawLabel.slice(1);
            }

            suggestionPropsRef.current.command({
                id: label,
                label: label,
            });
        }

        setShowSuggestions(false);
        setSelectedIndex(0);
    };



    const renderHighlightedText = (text: string, query: string) => {
        if (!query.trim()) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <>
                {parts.map((part, i) => (
                    part.toLowerCase() === query.toLowerCase() ? (
                        <mark key={i} className="bg-primary/20 text-primary px-0.5 rounded-sm font-medium">{part}</mark>
                    ) : (
                        part
                    )
                ))}
            </>
        );
    };

    const handleTogglePrivate = () => {
        setIsPrivate(!isPrivate);
        if (!isPrivate) {
            // Turning on: reset any previous inputs
            setAccessCode('');
            setAccessHint('');
        }
    };

    const handlePublishClick = () => {
        if (!content.trim() || isPending) return;

        if (isPrivate) {
            setShowPrivateDialog(true);
        } else {
            performPublish();
        }
    };

    const performPublish = async () => {
        const textContent = editor?.getText() || content;
        if (!textContent.trim() || isPending) return;

        // 终极校验：发布前再次从文本中提取标签
        // 使用更严谨的正则提取，支持中文且避免误识
        const hashtagRegex = /(?:^|\s|(?<=[^a-zA-Z0-9]))#([\w\u4e00-\u9fa5]+)/g;
        const matches = textContent.matchAll(hashtagRegex);
        const finalTags = Array.from(new Set(Array.from(matches).map(m => m[1])));

        setIsPending(true);
        setError(null);
        setShowPrivateDialog(false);

        const formData = new FormData();
        formData.append('content', textContent);
        finalTags.forEach(tag => formData.append('tags', tag));
        formData.append('is_private', String(isPrivate));
        formData.append('is_pinned', String(isPinned));

        if (isPrivate && accessCode) {
            formData.append('access_code', accessCode);
            formData.append('access_code_hint', accessHint);
        }

        try {
            let result;
            if (mode === 'edit' && memo) {
                formData.append('id', memo.id);
                result = await updateMemoContent(formData);
            } else {
                result = await createMemo(formData);
            }

            if (result.success) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newMemo = (result as any).data;
                if (newMemo) {
                    if (newMemo) {
                        // Update Cache Optimistically
                        memoCache.addItem({
                            id: newMemo.id,
                            memo_number: newMemo.memo_number || 0,
                            content: newMemo.content,
                            created_at: newMemo.created_at
                        });

                        // No need to update local state since we use memoCache now, 
                        // but if we are in 'edit', we might need to refresh something? 
                        // Actually logic below was dealing with 'suggestionItems' state directly.
                        // Now we rely on fetchMentionSuggestions re-running if needed, 
                        // or next time user opens suggestions.
                        refreshTags();
                        refreshStats();
                    }
                }

                if (mode === 'create') {
                    editor?.commands.setContent('');
                    setContent('');
                    setTags([]);
                    setIsPrivate(false);
                    setAccessCode('');
                    setAccessHint('');
                    setIsPinned(false);
                    router.refresh();
                } else {
                    onSuccess?.();
                    router.refresh();
                }
            } else {
                setError(typeof result.error === 'string' ? result.error : '操作失败，请稍后重试');
            }
        } catch (err) {
            setError('服务器连接失败');
        } finally {
            setIsPending(false);
        }
    };


    return (
        <motion.section
            animate={{
                paddingTop: 24, // p-6
                paddingBottom: 24,
                paddingLeft: 24,
                paddingRight: 24,
                minHeight: isActuallyCollapsed ? 0 : (hideFullscreen ? 500 : 120),
                boxShadow: isActuallyCollapsed ? "none" : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                backgroundColor: isActuallyCollapsed ? "transparent" : "var(--card)",
            }}
            transition={{
                type: "spring",
                damping: 40,
                stiffness: 350,
                mass: 1.0,
                restDelta: 0.001
            }}
            onAnimationStart={() => setIsAnimating(true)}
            onAnimationComplete={() => setIsAnimating(false)}
            style={{
                willChange: "transform, height, opacity",
                maskImage: isActuallyCollapsed && !isAnimating
                    ? "linear-gradient(to bottom, black 50%, transparent 100%)"
                    : "none",
                WebkitMaskImage: isActuallyCollapsed && !isAnimating
                    ? "linear-gradient(to bottom, black 50%, transparent 100%)"
                    : "none",
            }}
            initial={false}
            onClick={() => {
                if (isActuallyCollapsed && editor) {
                    editor.commands.focus();
                }
            }}
            className={cn(
                "bg-card border border-border rounded-sm relative focus-within:shadow-md",
                "flex flex-col items-stretch",
                isActuallyCollapsed ? "shadow-none cursor-pointer hover:bg-accent/5" : (hideFullscreen ? "h-full" : "")
            )}>
            <motion.div
                className="w-full flex-1 flex flex-col min-h-0"
            >
                <div ref={relativeGroupRef} className="relative group w-full flex-1 flex flex-col min-h-0">
                    <label htmlFor="memo-content" className="sr-only">Memo内容</label>

                    <motion.div
                        ref={editorContainerRef}
                        animate={{
                            maxHeight: isActuallyCollapsed ? 48 : 500, // 3rem = 48px
                            overflow: (isActuallyCollapsed || isAnimating) ? "hidden" : "visible"
                        }}
                        transition={{
                            type: "spring",
                            damping: 40,
                            stiffness: 350,
                            mass: 1.0
                        }}
                        style={{
                            willChange: "transform, max-height",
                            ...(isActuallyCollapsed ? {
                                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                            } : {
                                maskImage: 'none',
                                WebkitMaskImage: 'none',
                            })
                        }}
                        className={cn(
                            "relative overflow-hidden",
                            hideFullscreen ? "flex-1 flex flex-col min-h-0" : "overflow-y-auto scrollbar-hover",
                            isActuallyCollapsed ? "pointer-events-none" : "min-h-[120px]"
                        )}

                    >

                        <EditorContent editor={editor} className={cn("flex-1 flex flex-col min-h-0", hideFullscreen && "min-h-0")} />
                    </motion.div>

                    {showSuggestions && (suggestions.length > 0 || isLoading || (suggestionTrigger === '#' && mentionQueryRef.current.length > 0)) && suggestionPosition && (
                        <div
                            className="absolute z-50 w-full max-w-[350px]"
                            style={{
                                top: suggestionPosition.top,
                                left: suggestionPosition.left,
                            }}
                            onMouseDown={(e) => e.preventDefault()} // 防止点击弹窗导致编辑器失焦
                        >
                            <div className="bg-background/95 backdrop-blur-md border border-border rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[450px]">
                                {isLoading || (isIndexLoading && suggestions.length === 0) ? (
                                    <div className="px-3 py-6 text-xs text-muted-foreground/60 text-center animate-pulse font-mono tracking-tight">
                                        加载中...
                                    </div>
                                ) : null}
                                {suggestions.length > 0 ? (
                                    <ul
                                        ref={suggestionListRef}
                                        className="divide-y divide-border/40 overflow-y-auto scrollbar-hover flex-1 min-h-0"
                                        onScroll={handleSuggestionScroll}
                                    >
                                        {suggestions.map((item, index) => (
                                            <li
                                                key={item.id}
                                                onClick={() => handleSelectSuggestion(item)}
                                                className={cn(
                                                    "flex flex-col gap-1.5 px-3 py-2.5 cursor-pointer outline-none transition-colors relative",
                                                    index === selectedIndex
                                                        ? "bg-accent text-accent-foreground"
                                                        : "hover:bg-accent/50 text-foreground"
                                                )}
                                            >
                                                {item.label.startsWith('#') ? (
                                                    <div className="flex justify-between items-center w-full">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-foreground/80">{item.label}</span>
                                                            {item.subLabel && (
                                                                <span className="text-[10px] text-muted-foreground/60 italic font-mono">
                                                                    {item.subLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.count !== undefined && (
                                                            <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">
                                                                {item.count}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-center w-full">
                                                            <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
                                                                {item.created_at ? new Date(item.created_at).toLocaleString('zh-CN', {
                                                                    year: 'numeric',
                                                                    month: '2-digit',
                                                                    day: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    second: '2-digit',
                                                                    hour12: false
                                                                }).replace(/\//g, '-') : ''}
                                                            </span>
                                                            {item.memo_number !== undefined && (
                                                                <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">
                                                                    #{item.memo_number}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs leading-relaxed text-foreground/80 break-words pr-2">
                                                            {item.subLabel && renderHighlightedText(item.subLabel, mentionQuery)}
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>



                {
                    error && (
                        <div className="mt-3 text-xs text-red-500 bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10 animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )
                }

                <motion.div
                    initial={false}
                    animate={{
                        height: isActuallyCollapsed ? 0 : "auto",
                        opacity: isActuallyCollapsed ? 0 : 1,
                    }}
                    transition={{
                        type: "spring",
                        damping: 40,
                        stiffness: 350,
                        mass: 1.0
                    }}
                    style={{ willChange: "opacity, height" }}
                    className="overflow-hidden bg-transparent"
                >
                    <div className="pt-5 mt-4 border-t border-border/50 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleTogglePrivate}
                                className={cn("h-8 px-2 gap-1.5", isPrivate ? "text-primary bg-primary/5" : "text-muted-foreground")}
                            >
                                {isPrivate ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                                <span className="text-xs font-medium">{isPrivate ? '私密' : '公开'}</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsPinned(!isPinned)}
                                className={cn("h-8 px-2 gap-1.5", isPinned ? "text-primary bg-primary/5" : "text-muted-foreground")}
                            >
                                <Pin className={cn("w-4 h-4", isPinned && "fill-current")} />
                                <span className="text-xs font-medium">置顶</span>
                            </Button>

                            {!hideFullscreen && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsFullscreen(true)}
                                    className="h-8 px-2 text-muted-foreground"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {content.trim().length > 0 && (
                                <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-1">
                                    {content.trim().length} 字
                                </span>
                            )}
                            <div className="flex items-center gap-2">
                                {(mode === 'edit' || content.trim()) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (mode === 'edit') {
                                                onCancel?.();
                                            } else {
                                                editor?.commands.setContent('');
                                                setContent('');
                                                setTags([]);
                                            }
                                        }}
                                        className="h-8 px-3 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        取消
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handlePublishClick}
                                    disabled={!content.trim() || isPending}
                                    className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all"
                                >
                                    {isPending ? '提交中...' : mode === 'edit' ? '保存' : '发布'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent
                    className="max-w-5xl h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background"
                    closeIcon={<Minimize2 className="h-4 w-4" />}
                    animateOffset={false}
                >
                    <DialogTitle className="sr-only">全屏编辑内容</DialogTitle>
                    <div className="flex-1 overflow-hidden flex items-start justify-center px-6 pt-10 bg-black/5">
                        <div className="max-w-4xl w-full mx-auto flex flex-col h-[85vh]">
                            <MemoEditor
                                mode={mode}
                                memo={memo}
                                isCollapsed={false}
                                hideFullscreen={true}
                                contextMemos={contextMemos}
                                onCancel={() => {
                                    setIsFullscreen(false);
                                    onCancel?.();
                                }}
                                onSuccess={() => {
                                    setIsFullscreen(false);
                                    onSuccess?.();
                                }}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showPrivateDialog} onOpenChange={setShowPrivateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>设置访问口令</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="access-code" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 after:content-['*'] after:ml-0.5 after:text-red-500">
                                访问口令
                            </label>
                            <div className="relative">
                                <Input
                                    id="access-code"
                                    type={showAccessCode ? "text" : "password"}
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="请输入访问口令"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowAccessCode(!showAccessCode)}
                                    className="absolute right-0 top-0 h-full"
                                    aria-label={showAccessCode ? "隐藏口令" : "显示口令"}
                                >
                                    {showAccessCode ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="access-hint" className="text-sm font-medium leading-none">
                                口令提示 (选填)
                            </label>
                            <Input
                                id="access-hint"
                                value={accessHint}
                                onChange={(e) => setAccessHint(e.target.value)}
                                placeholder="例如：我的生日"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowPrivateDialog(false)}>取消</Button>
                        <Button onClick={performPublish} disabled={!accessCode}>发布</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.section>
    );
}
