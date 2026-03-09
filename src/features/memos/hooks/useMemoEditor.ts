'use client';

import { useState, useEffect, useCallback } from 'react';
import { Memo } from '@/types/memo';
import { createMemo, updateMemoContent } from '@/actions/memos/mutate';
import { memoCache } from '@/lib/memo-cache';
import { useTags } from '@/context/TagsContext';
import { useStats } from '@/context/StatsContext';
import { Editor } from '@tiptap/react';

// Draft Persistence Keys
export const DRAFT_CONTENT_KEY = 'memo_editor_draft_content';
export const DRAFT_IS_PRIVATE_KEY = 'memo_editor_draft_is_private';

interface UseMemoEditorProps {
    mode: 'create' | 'edit';
    initialMemo?: Memo;
    onSuccess?: (memo?: Memo) => void;
    onCancel?: () => void;
}

export function useMemoEditor({ mode, initialMemo, onSuccess, onCancel }: UseMemoEditorProps) {
    const { refreshTags } = useTags();
    const { refreshStats } = useStats();

    const [content, setContent] = useState(initialMemo?.content || '');
    const [isPending, setIsPending] = useState(false);
    const [isPrivate, setIsPrivate] = useState(initialMemo?.is_private || false);
    const [accessCode, setAccessCode] = useState('');
    const [accessHint, setAccessHint] = useState('');
    const [isPinned, setIsPinned] = useState(initialMemo?.is_pinned || false);
    const [error, setError] = useState<string | null>(null);

    // UI States that should stay in Hook for consistency
    const [showPrivateDialog, setShowPrivateDialog] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    // Draft Loading Effect
    useEffect(() => {
        if (mode === 'create' && !initialMemo && typeof window !== 'undefined') {
            const draftIsPrivate = localStorage.getItem(DRAFT_IS_PRIVATE_KEY);
            if (draftIsPrivate) {
                setIsPrivate(draftIsPrivate === 'true');
            }
        }
    }, [mode, initialMemo]);

    const handleTogglePrivate = useCallback(() => {
        const newState = !isPrivate;
        setIsPrivate(newState);
        if (mode === 'create') {
            localStorage.setItem(DRAFT_IS_PRIVATE_KEY, String(newState));
        }
        if (!newState) {
            setAccessCode('');
            setAccessHint('');
        }
    }, [isPrivate, mode]);

    const performPublish = async (editor: Editor | null) => {
        const textContent = editor?.getText({ blockSeparator: '\n' }) || content;
        if (!textContent.trim() || isPending) return;

        setIsPending(true);
        setError(null);
        setShowPrivateDialog(false);

        const formData = new FormData();
        formData.append('content', textContent);
        formData.append('is_private', String(isPrivate));
        formData.append('is_pinned', String(isPinned));

        if (isPrivate && accessCode) {
            formData.append('access_code', accessCode);
            formData.append('access_code_hint', accessHint);
        }

        try {
            let result;
            if (mode === 'edit' && initialMemo) {
                formData.append('id', initialMemo.id);
                result = await updateMemoContent(formData);
            } else {
                result = await createMemo(formData);
            }

            if (result.success) {
                const newMemo = result.data as Memo | undefined;
                if (newMemo) {
                    memoCache.addItem({
                        id: newMemo.id,
                        memo_number: newMemo.memo_number || 0,
                        content: newMemo.content,
                        created_at: newMemo.created_at
                    });

                    Promise.all([
                        refreshTags?.(),
                        refreshStats?.()
                    ]).catch(err => console.error('[Sync] Stats refresh failed:', err));
                }

                if (mode === 'create') {
                    localStorage.removeItem(DRAFT_CONTENT_KEY);
                    localStorage.removeItem(DRAFT_IS_PRIVATE_KEY);

                    editor?.commands.setContent('');
                    setContent('');
                    setIsPrivate(false);
                    setAccessCode('');
                    setAccessHint('');
                    setIsPinned(false);
                } else {
                    onSuccess?.(newMemo);
                }
            } else {
                setError(typeof result.error === 'string' ? result.error : '操作失败，请稍后重试');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '服务器连接失败');
        } finally {
            setIsPending(false);
        }
    };

    const handleCancel = useCallback(() => {
        if (mode === 'edit') {
            onCancel?.();
        } else {
            localStorage.removeItem(DRAFT_CONTENT_KEY);
            localStorage.removeItem(DRAFT_IS_PRIVATE_KEY);
            setContent('');
            setIsPrivate(false);
        }
    }, [mode, onCancel]);

    return {
        content, setContent,
        isPending, setIsPending,
        isPrivate, setIsPrivate,
        accessCode, setAccessCode,
        accessHint, setAccessHint,
        isPinned, setIsPinned,
        error, setError,
        showPrivateDialog, setShowPrivateDialog,
        isFocused, setIsFocused,
        isFullscreen, setIsFullscreen,
        isAnimating, setIsAnimating,
        showLocationPicker, setShowLocationPicker,
        handleTogglePrivate,
        performPublish,
        handleCancel
    };
}
