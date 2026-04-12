'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { SuggestionProps } from '@tiptap/suggestion';
import { searchMemosForMention } from '@/actions/memos/query';

export interface SuggestionItem {
    id: string;
    label: string;
    subLabel?: string;
    count?: number;
    memo_number?: number;
    created_at?: string;
}

export type CustomSuggestionProps = SuggestionProps<SuggestionItem>;

// Helper to generate smart snippet (Internal to hook)
const generateSnippet = (content?: string, query?: string): string => {
    if (!content) return '';
    const text = content.replace(/!\[.*?\]\(.*?\)/g, '[图片]');
    if (!query || !query.trim()) return text.substring(0, 100);

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text.substring(0, 100);
    if (index < 40) return text.substring(0, 100);

    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + 80);
    return '...' + text.substring(start, end);
};

export function useEditorSuggestions() {
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionQuery, setMentionQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasMoreMentions, setHasMoreMentions] = useState(true);
    const [suggestionPosition, setSuggestionPosition] = useState<{ top: number; left: number } | null>(null);

    // Refs for synchronization and performance
    const suggestionsRef = useRef<SuggestionItem[]>([]);
    const selectedIndexRef = useRef(0);
    const suggestionPropsRef = useRef<CustomSuggestionProps | null>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isFetchingMoreRef = useRef(false);
    const mentionQueryRef = useRef('');

    useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);
    useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
    useEffect(() => { mentionQueryRef.current = mentionQuery; }, [mentionQuery]);

    const fetchMentionSuggestions = useCallback(async (query: string, offset: number = 0) => {
        setMentionQuery(query);
        const isInitial = offset === 0;
        if (isInitial) {
            setSelectedIndex(0);
            setHasMoreMentions(true);
        }

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        const performFetch = async () => {
            setIsLoading(true);
            try {
                const res = await searchMemosForMention(query, offset, 20);
                const results = res.success ? (res.data || []) : [];
                const items: SuggestionItem[] = results.map((m) => ({
                    id: m.id!,
                    label: `@${m.memo_number}`,
                    subLabel: generateSnippet(m.content, query),
                    memo_number: m.memo_number,
                    created_at: m.created_at
                }));

                setSuggestions(prev => {
                    if (isInitial) return items;
                    const existingIds = new Set(prev.map(p => p.id));
                    return [...prev, ...items.filter(it => !existingIds.has(it.id))];
                });

                setHasMoreMentions(items.length === 20);
            } catch (err) {
                console.error("Remote mention search failed", err);
            } finally {
                setIsLoading(false);
                isFetchingMoreRef.current = false;
            }
        };

        if (isInitial && query.trim().length > 0) {
            debounceTimerRef.current = setTimeout(performFetch, 300);
        } else {
            performFetch();
        }
    }, []);

    const fetchHashtagSuggestions = useCallback(async (query: string) => {
        setMentionQuery(query);
        setSelectedIndex(0);
        setIsLoading(true);

        try {
            const { getAllTags } = await import('@/actions/memos/analytics');
            const res = await getAllTags();
            
            if (res.success && res.data) {
                const lowerQuery = query.toLowerCase();
                // 过滤并按使用次数排序
                const filtered = res.data
                    .filter(t => t.tag_name.toLowerCase().includes(lowerQuery))
                    .sort((a, b) => b.count - a.count)
                    .map(t => ({
                        id: t.tag_name,
                        label: `#${t.tag_name}`,
                        count: t.count
                    }));

                // 如果当前输入的标签不在建议列表中，将其作为第一个选项
                const exactMatch = filtered.find(f => f.id.toLowerCase() === lowerQuery);
                if (!exactMatch && query.trim()) {
                    filtered.unshift({
                        id: query,
                        label: `#${query}`,
                        count: 0
                    });
                }
                
                setSuggestions(filtered);
            }
        } catch (err) {
            console.error("Fetch hashtag suggestions failed", err);
            setSuggestions([{ id: query, label: `#${query}` }]);
        } finally {
            setIsLoading(false);
            setHasMoreMentions(false);
        }
    }, []);

    const updateSuggestionPosition = useCallback((props: CustomSuggestionProps) => {
        const rect = props.clientRect?.();
        if (rect) {
            // 使用 viewport 坐标
            let left = rect.left;
            let top = rect.bottom + 4;

            // 越界处理 (视口宽度 - 菜单宽度 - 间距)
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const menuWidth = 350;
            const menuHeight = 400; // 预估高度

            if (left + menuWidth > viewportWidth - 20) {
                left = viewportWidth - menuWidth - 20;
            }
            if (left < 20) left = 20;

            // 向上弹出检测 (如果下方空间不足)
            if (top + menuHeight > viewportHeight - 20 && rect.top > menuHeight) {
                top = rect.top - menuHeight - 4;
            }

            setSuggestionPosition({ top, left });
        }
    }, []);

    const handleSelectSuggestion = useCallback((item: SuggestionItem, editor: Editor | null) => {
        if (!editor || !suggestionPropsRef.current) return;

        const rawLabel = item.label;
        let label = rawLabel;
        if (rawLabel.startsWith('@') || rawLabel.startsWith('#')) {
            label = rawLabel.slice(1);
        }

        suggestionPropsRef.current.command({
            id: label,
            label: label,
        });

        setShowSuggestions(false);
        setSelectedIndex(0);
        setMentionQuery('');
    }, []);

    const handleSuggestionScroll = useCallback(async (e: React.UIEvent<HTMLUListElement>) => {
        const target = e.currentTarget;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 150;

        if (isNearBottom && !isLoading && hasMoreMentions && !isFetchingMoreRef.current) {
            isFetchingMoreRef.current = true;
            fetchMentionSuggestions(mentionQueryRef.current, suggestionsRef.current.length);
        }
    }, [isLoading, hasMoreMentions, fetchMentionSuggestions]);

    return {
        suggestions, setSuggestions,
        showSuggestions, setShowSuggestions,
        selectedIndex, setSelectedIndex,
        mentionQuery, setMentionQuery,
        isLoading,
        hasMoreMentions,
        suggestionPosition,
        suggestionsRef,
        selectedIndexRef,
        suggestionPropsRef,
        mentionQueryRef,
        fetchMentionSuggestions,
        fetchHashtagSuggestions,
        updateSuggestionPosition,
        handleSelectSuggestion,
        handleSuggestionScroll
    };
}
