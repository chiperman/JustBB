'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { SuggestionProps } from '@tiptap/suggestion';
import { searchMemosForMention } from '@/actions/memos/query';
import { useUnlockedMemos } from '@/context/UnlockedMemosContext';

export interface SuggestionItem {
    id: string;
    label: string;
    subLabel?: string;
    count?: number;
    memo_number?: number;
    created_at?: string;
}

export type CustomSuggestionProps = SuggestionProps<SuggestionItem>;

// --- 全局内存缓存 (SWR 驱动) ---
const SUGGESTION_CACHE = {
    tags: null as { data: SuggestionItem[], timestamp: number } | null,
    mentions: new Map<string, { data: SuggestionItem[], timestamp: number }>(),
    // 缓存有效期设置得稍短一些，配合 SWR 策略
    CACHE_TTL: 2 * 60 * 1000, 
};

// Helper to generate smart snippet
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
    const { unlockedMemoIds } = useUnlockedMemos();
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
    
    // 请求序列锁
    const requestVersionRef = useRef(0);

    useEffect(() => { suggestionsRef.current = suggestions; }, [suggestions]);
    useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);
    useEffect(() => { mentionQueryRef.current = mentionQuery; }, [mentionQuery]);

    /**
     * SWR 核心逻辑：获取并处理标签
     */
    const fetchHashtagSuggestions = useCallback(async (query: string) => {
        const currentVersion = ++requestVersionRef.current;
        setMentionQuery(query);
        setSelectedIndex(0);

        // 1. 尝试渲染缓存 (Stale)
        let hasValidCache = false;
        if (SUGGESTION_CACHE.tags) {
            const lowerQuery = query.toLowerCase();
            const filtered = SUGGESTION_CACHE.tags.data
                .filter(t => t.id.toLowerCase().includes(lowerQuery))
                .sort((a, b) => (b.count || 0) - (a.count || 0));

            const exactMatch = filtered.find(f => f.id.toLowerCase() === lowerQuery);
            if (!exactMatch && query.trim()) {
                filtered.unshift({ id: query, label: `#${query}`, count: 0 });
            }
            
            if (currentVersion === requestVersionRef.current) {
                setSuggestions(filtered);
                // 如果缓存没过期，就不显示加载动画，但仍会在后台更新
                const isFresh = (Date.now() - SUGGESTION_CACHE.tags.timestamp < SUGGESTION_CACHE.CACHE_TTL);
                if (!isFresh) setIsLoading(true);
                hasValidCache = true;
            }
        }

        // 如果没有缓存，立即显示加载状态并清空旧列表
        if (!hasValidCache) {
            setIsLoading(true);
            setSuggestions([]);
        }

        // 2. 后台验证 (Revalidate)
        try {
            const { getAllTags } = await import('@/actions/memos/analytics');
            const res = await getAllTags();
            
            if (res.success && res.data) {
                const allTags: SuggestionItem[] = res.data.map(t => ({
                    id: t.tag_name, label: `#${t.tag_name}`, count: t.count
                }));

                // 更新全局缓存
                SUGGESTION_CACHE.tags = { data: allTags, timestamp: Date.now() };
                
                // 如果版本没变，重新过滤并渲染最新结果
                if (currentVersion === requestVersionRef.current) {
                    const lowerQuery = query.toLowerCase();
                    const freshFiltered = allTags
                        .filter(t => t.id.toLowerCase().includes(lowerQuery))
                        .sort((a, b) => (b.count || 0) - (a.count || 0));

                    const exactMatch = freshFiltered.find(f => f.id.toLowerCase() === lowerQuery);
                    if (!exactMatch && query.trim()) {
                        freshFiltered.unshift({ id: query, label: `#${query}`, count: 0 });
                    }
                    setSuggestions(freshFiltered);
                }
            }
        } catch (err) {
            console.error("Revalidate hashtags failed", err);
        } finally {
            if (currentVersion === requestVersionRef.current) {
                setIsLoading(false);
                setHasMoreMentions(false);
            }
        }
    }, []);

    /**
     * SWR 核心逻辑：获取并处理提及 (@)
     */
    const fetchMentionSuggestions = useCallback(async (query: string, offset: number = 0) => {
        const isInitial = offset === 0;
        const currentVersion = ++requestVersionRef.current;
        
        if (isInitial) {
            setSelectedIndex(0);
            setHasMoreMentions(true);
            setMentionQuery(query);
            
            // 1. 尝试渲染缓存 (Stale)
            const cached = SUGGESTION_CACHE.mentions.get(query);
            if (cached) {
                setSuggestions(cached.data);
                const isFresh = (Date.now() - cached.timestamp < SUGGESTION_CACHE.CACHE_TTL);
                if (isFresh) {
                    setIsLoading(false);
                } else {
                    setIsLoading(true);
                }
            } else {
                setSuggestions([]);
                setIsLoading(true);
            }
        }

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        const performFetch = async () => {
            if (!isInitial) setIsLoading(true);
            try {
                const res = await searchMemosForMention(query, offset, 20, unlockedMemoIds);
                if (currentVersion !== requestVersionRef.current) return;

                const results = res.success ? (res.data || []) : [];
                const items: SuggestionItem[] = results.map((m) => ({
                    id: m.id!,
                    label: `@${m.memo_number}`,
                    subLabel: generateSnippet(m.content, query),
                    memo_number: m.memo_number,
                    created_at: m.created_at
                }));

                const newSuggestions = isInitial ? items : [...suggestionsRef.current, ...items.filter(it => !suggestionsRef.current.find(p => p.id === it.id))];
                
                setSuggestions(newSuggestions);
                setHasMoreMentions(items.length === 20);

                // 2. 更新缓存 (Revalidate)
                if (isInitial) {
                    SUGGESTION_CACHE.mentions.set(query, { data: items, timestamp: Date.now() });
                    // 保持 LRU 策略，避免 Map 过大
                    if (SUGGESTION_CACHE.mentions.size > 50) {
                        const firstKey = SUGGESTION_CACHE.mentions.keys().next().value;
                        if (firstKey !== undefined) SUGGESTION_CACHE.mentions.delete(firstKey);
                    }
                }
            } catch (err) {
                console.error("Revalidate mentions failed", err);
            } finally {
                if (currentVersion === requestVersionRef.current) {
                    setIsLoading(false);
                    isFetchingMoreRef.current = false;
                }
            }
        };

        if (isInitial && query.trim().length > 0) {
            debounceTimerRef.current = setTimeout(performFetch, 300);
        } else {
            performFetch();
        }
    }, [unlockedMemoIds]);

    const updateSuggestionPosition = useCallback((props: CustomSuggestionProps) => {
        const rect = props.clientRect?.();
        if (rect) {
            let left = rect.left;
            let top = rect.bottom + 4;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const menuWidth = 350;
            const menuHeight = 400;

            if (left + menuWidth > viewportWidth - 20) {
                left = viewportWidth - menuWidth - 20;
            }
            if (left < 20) left = 20;

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
