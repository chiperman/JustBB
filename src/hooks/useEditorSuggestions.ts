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

    const fetchHashtagSuggestions = useCallback((query: string) => {
        setMentionQuery(query);
        setSelectedIndex(0);
        // Hashtag suggestions are usually simpler, often just echo the query
        setSuggestions([{ id: query, label: `#${query}` }]);
        setHasMoreMentions(false);
    }, []);

    const updateSuggestionPosition = useCallback((props: CustomSuggestionProps, relativeRef: React.RefObject<HTMLDivElement | null>) => {
        const rect = props.clientRect?.();
        if (rect && relativeRef.current) {
            const parentRect = relativeRef.current.getBoundingClientRect();
            let left = rect.left - parentRect.left;
            const top = rect.bottom - parentRect.top + 8;

            const maxLeft = parentRect.width - 370;
            if (left > maxLeft) left = maxLeft;
            if (left < 0) left = 10;

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
