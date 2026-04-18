'use client';

import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import { motion } from 'framer-motion';

import { EditorSuggestionMenu } from '@/features/memos/components/EditorSuggestionMenu';
import { MemoPrivateDialog } from '@/features/memos/components/MemoPrivateDialog';
import { LocationPickerDialog } from '@/features/memos/components/LocationPickerDialog';
import { EditorToolbar } from '@/features/memos/components/editor/EditorToolbar';
import { getExtensions, textToTiptapHtml } from '@/features/memos/components/editor/extensions';

import { useMemoEditor, DRAFT_CONTENT_KEY } from '@/features/memos/hooks/useMemoEditor';
import { useEditorSuggestions, CustomSuggestionProps } from '@/features/memos/hooks/useEditorSuggestions';
import { Memo } from '@/types/memo';

interface MemoEditorProps {
    mode?: 'create' | 'edit';
    memo?: Memo;
    onCancel?: () => void;
    onSuccess?: (memo?: Memo) => void;
    isCollapsed?: boolean;
    scrollCollapsed?: boolean;
    className?: string;
}

export function MemoEditor({
    mode = 'create',
    memo,
    onCancel,
    onSuccess,
    isCollapsed: isPropCollapsed = false,
    scrollCollapsed = false,
    className,
}: MemoEditorProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const relativeGroupRef = useRef<HTMLDivElement>(null);

    const {
        content, setContent,
        isPending,
        isPrivate,
        accessCode, setAccessCode,
        accessHint, setAccessHint,
        isPinned, setIsPinned,
        error, setError,
        showPrivateDialog, setShowPrivateDialog,
        isFocused, setIsFocused,
        isAnimating, setIsAnimating,
        showLocationPicker, setShowLocationPicker,
        handleTogglePrivate,
        performPublish,
        handleCancel
    } = useMemoEditor({ mode, initialMemo: memo, onSuccess, onCancel });

    const {
        suggestions,
        showSuggestions, setShowSuggestions,
        selectedIndex, setSelectedIndex,
        mentionQuery,
        isLoading,
        hasMoreMentions,
        suggestionPosition,
        suggestionsRef,
        selectedIndexRef,
        suggestionPropsRef,
        fetchMentionSuggestions,
        fetchHashtagSuggestions,
        updateSuggestionPosition,
        handleSelectSuggestion,
        handleSuggestionScroll
    } = useEditorSuggestions();

    const isActuallyCollapsed = (isPropCollapsed || scrollCollapsed) && !isFocused && !showLocationPicker && !showPrivateDialog && mode === 'create';

    const extensions = useMemo(() => 
        // eslint-disable-next-line react-hooks/refs
        getExtensions({
        onMentionStart: (props) => {
            suggestionPropsRef.current = props;
            setShowSuggestions(true);
            fetchMentionSuggestions(props.query, 0);
            updateSuggestionPosition(props);
        },
        onMentionUpdate: (props) => {
            suggestionPropsRef.current = props;
            fetchMentionSuggestions(props.query, 0);
            updateSuggestionPosition(props);
        },
        onMentionExit: () => {
            setShowSuggestions(false);
            suggestionPropsRef.current = null;
        },
        onMentionKeyDown: (props) => {
            if (props.event.key === 'Escape') {
                setShowSuggestions(false);
                return true;
            }
            if (props.event.key === ' ' && suggestionPropsRef.current) {
                const query = suggestionPropsRef.current.query;
                if (/^\d+$/.test(query)) {
                    suggestionPropsRef.current.command({ id: query, label: query });
                    props.event.preventDefault();
                    return true;
                }
            }
            if (props.event.key === 'ArrowUp') {
                const len = suggestionsRef.current?.length || 0;
                setSelectedIndex((prev) => (prev + len - 1) % (len || 1));
                props.event.preventDefault();
                return true;
            }
            if (props.event.key === 'ArrowDown') {
                const len = suggestionsRef.current?.length || 0;
                setSelectedIndex((prev) => (prev + 1) % (len || 1));
                props.event.preventDefault();
                return true;
            }
            if (props.event.key === 'Enter') {
                const item = suggestionsRef.current?.[selectedIndexRef.current];
                if (item && suggestionPropsRef.current) {
                    const label = item.label.startsWith('@') ? item.label.slice(1) : item.label;
                    suggestionPropsRef.current.command({ id: label, label: label });
                    props.event.preventDefault();
                    props.event.stopPropagation();
                    return true;
                }
            }
            return false;
        },
        onHashtagStart: (props) => {
            suggestionPropsRef.current = props;
            setShowSuggestions(true);
            fetchHashtagSuggestions(props.query);
            updateSuggestionPosition(props);
        },
        onHashtagUpdate: (props) => {
            suggestionPropsRef.current = props;
            fetchHashtagSuggestions(props.query);
            updateSuggestionPosition(props);
        },
        onHashtagExit: () => {
            setShowSuggestions(false);
            suggestionPropsRef.current = null;
        },
        onHashtagKeyDown: (props) => {
            if (props.event.key === 'Escape') {
                setShowSuggestions(false);
                return true;
            }
            if (props.event.key === ' ' && suggestionPropsRef.current) {
                const query = suggestionPropsRef.current.query;
                if (/^[\w\u4e00-\u9fa5]+$/.test(query)) {
                    suggestionPropsRef.current.command({ id: query, label: query });
                    props.event.preventDefault();
                    return true;
                }
            }
            if (props.event.key === 'ArrowUp') {
                const len = suggestionsRef.current?.length || 0;
                setSelectedIndex((prev) => (prev + len - 1) % (len || 1));
                props.event.preventDefault();
                return true;
            }
            if (props.event.key === 'ArrowDown') {
                const len = suggestionsRef.current?.length || 0;
                setSelectedIndex((prev) => (prev + 1) % (len || 1));
                props.event.preventDefault();
                return true;
            }
            if (props.event.key === 'Enter') {
                const item = suggestionsRef.current?.[selectedIndexRef.current];
                if (suggestionPropsRef.current && item) {
                    const rawLabel = item.label;
                    const label = rawLabel.startsWith('#') ? rawLabel.slice(1) : rawLabel;
                    suggestionPropsRef.current.command({ id: label, label: label });
                    props.event.preventDefault();
                    props.event.stopPropagation();
                    return true;
                }
            }
            return false;
        }
    }), [
        fetchHashtagSuggestions,
        fetchMentionSuggestions,
        setSelectedIndex,
        setShowSuggestions,
        updateSuggestionPosition,
        selectedIndexRef,
        suggestionPropsRef,
        suggestionsRef
    ]);

    const editor = useEditor({
        immediatelyRender: false,
        extensions,
        content: memo?.content || '',
        onUpdate: ({ editor }) => {
            const text = editor.getText({ blockSeparator: '\n' });
            setContent(text);
            setError(null);
            if (mode === 'create') {
                localStorage.setItem(DRAFT_CONTENT_KEY, JSON.stringify(editor.getJSON()));
            }
        },
        onFocus: () => {
            setIsFocused(true);
            setTimeout(() => {
                if (!editor) return;
                const { from } = editor.state.selection;
                const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from);
                const mentionMatch = textBefore.match(/(?:^|\s)(@|#)(\w*)$/);
                if (mentionMatch) {
                    const char = mentionMatch[1];
                    const query = mentionMatch[2];
                    const startPos = from - mentionMatch[2].length - 1;
                    suggestionPropsRef.current = {
                        editor,
                        query,
                        range: { from: startPos, to: from },
                        command: (props: { label: string }) => {
                            editor.chain().focus().deleteRange({ from: startPos, to: from }).insertContent([
                                {
                                    type: char === '@' ? 'mention' : 'hashtag',
                                    attrs: { id: props.label, label: props.label }
                                },
                                { type: 'text', text: ' ' }
                            ]).run();
                        }
                    } as CustomSuggestionProps;
                    setShowSuggestions(true);
                    if (char === '@') fetchMentionSuggestions(query, 0);
                    else fetchHashtagSuggestions(query);
                }
            }, 100);
        },
        onBlur: () => {
            setIsFocused(false);
            setShowSuggestions(false);
        },
        editorProps: {
            attributes: {
                class: cn(
                    "tiptap prose prose-sm max-w-none focus:outline-none text-foreground/80 leading-relaxed tracking-normal",
                    "min-h-[120px] text-base"
                ),
            },
        },
    });

    const prevScrollCollapsed = useRef(scrollCollapsed);

    // 监听滚动收缩信号，如果在聚焦状态下发生深滚，主动失焦以触发收缩
    useEffect(() => {
        // 只有当 scrollCollapsed 从 false 变为 true 的“入场瞬间”且正在聚焦时才触发 blur
        if (scrollCollapsed && !prevScrollCollapsed.current && isFocused && mode === 'create' && editor) {
            editor.commands.blur();
        }
        prevScrollCollapsed.current = scrollCollapsed;
    }, [scrollCollapsed, isFocused, editor, mode]);

    useEffect(() => {
        if (editor) {
            if (mode === 'edit' && memo?.content) {
                editor.commands.setContent(textToTiptapHtml(memo.content));
            } else if (mode === 'create') {
                const draftContent = localStorage.getItem(DRAFT_CONTENT_KEY);
                if (draftContent && draftContent.trim() && editor.getText().trim() === '') {
                    try {
                        const json = JSON.parse(draftContent);
                        editor.commands.setContent(json);
                    } catch {
                        editor.commands.setContent(textToTiptapHtml(draftContent));
                    }
                    setContent(editor.getText());
                }
            }
        }
    }, [editor, memo, mode, setContent]);

    const handleToolbarCancel = () => {
        if (mode === 'create') {
            editor?.commands.clearContent();
            editor?.commands.blur();
        }
        handleCancel();
    };


    return (
        <motion.section
            initial={false}
            animate={{
                opacity: 1,
                height: isActuallyCollapsed ? "auto" : "auto",
                minHeight: isActuallyCollapsed ? 0 : 120,
                padding: 24,
                boxShadow: isActuallyCollapsed ? "none" : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            }}
            exit={{
                opacity: 0,
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                marginTop: -24, 
                marginBottom: -24,
                borderWidth: 0,
                boxShadow: "none",
                transition: { 
                    opacity: { duration: 0.2 }, 
                    height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                    paddingTop: { duration: 0.3 },
                    paddingBottom: { duration: 0.3 },
                    marginTop: { duration: 0.3 },
                    marginBottom: { duration: 0.3 },
                    borderWidth: { duration: 0.3 }
                }
            }}
            transition={{
                height: isActuallyCollapsed 
                    ? { type: 'spring', stiffness: 350, damping: 40 } // 设计文档收缩参数
                    : { duration: 0.4, ease: [0.22, 1, 0.36, 1] },   // 设计文档展开参数
                opacity: { duration: 0.2 }
            }}
            onAnimationStart={() => setIsAnimating(true)}
            onAnimationComplete={() => setIsAnimating(false)}
            style={{
                willChange: "transform, height, opacity",
                overflow: (isActuallyCollapsed || isAnimating) ? 'hidden' : 'visible'
            }}
            className={cn(
                "border border-border rounded-inner relative flex flex-col items-stretch selection:bg-primary/30",
                isActuallyCollapsed && "shadow-none cursor-pointer hover:bg-accent/5",
                className
            )}
            onClick={() => {
                if (isActuallyCollapsed && editor) {
                    const selection = window.getSelection();
                    if (!selection || selection.toString().length === 0) {
                        editor.commands.focus('end');
                    }
                }
            }}
        >
            <motion.div
                className="absolute inset-0 bg-card rounded-inner pointer-events-none"
                animate={{ opacity: isActuallyCollapsed ? 0 : 1 }}
            />

            <div className="w-full flex-1 flex flex-col min-h-0">
                <div ref={relativeGroupRef} className="relative group w-full flex-1 flex flex-col min-h-0">
                    <motion.div
                        ref={editorContainerRef}
                        animate={{
                            height: isActuallyCollapsed ? 26 : "auto",
                            minHeight: isActuallyCollapsed ? 0 : 120,
                        }}
                        className={cn(
                            "relative",
                            isActuallyCollapsed ? "min-h-0 scrollbar-hide overflow-hidden" : "overflow-y-auto scrollbar-hover"
                        )}
                        style={{
                            maxHeight: 500,
                            maskImage: isActuallyCollapsed ? 'linear-gradient(to bottom, black 90%, transparent 100%)' : 'none',
                        }}
                    >
                        {!editor && (
                            <div className="tiptap prose prose-sm max-w-none text-muted-foreground/50 absolute inset-0 pointer-events-none">
                                <p>Wanna memo something? JustMemo it!</p>
                            </div>
                        )}
                        <EditorContent editor={editor} className="flex-1 flex flex-col min-h-0" />
                    </motion.div>

                    {showSuggestions && (
                        <EditorSuggestionMenu
                            suggestions={suggestions}
                            selectedIndex={selectedIndex}
                            isLoading={isLoading}
                            hasMore={hasMoreMentions}
                            query={mentionQuery}
                            position={suggestionPosition}
                            onSelect={(item) => handleSelectSuggestion(item, editor)}
                            onScroll={handleSuggestionScroll}
                        />
                    )}
                </div>

                {error && (
                    <div className="mt-3 text-xs text-red-500 bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10">
                        {error}
                    </div>
                )}

                <EditorToolbar
                    isActuallyCollapsed={isActuallyCollapsed}
                    isPrivate={isPrivate}
                    isPinned={isPinned}
                    isPending={isPending}
                    content={content}
                    mode={mode}
                    onTogglePrivate={handleTogglePrivate}
                    onTogglePinned={() => setIsPinned(!isPinned)}
                    onShowLocationPicker={() => setShowLocationPicker(true)}
                    onCancel={handleToolbarCancel}
                    onPublish={() => isPrivate ? setShowPrivateDialog(true) : performPublish(editor)}
                />
            </div>


            <MemoPrivateDialog
                open={showPrivateDialog}
                onOpenChange={(open) => {
                    setShowPrivateDialog(open);
                    if (!open) { setIsFocused(true); editor?.commands.focus(); }
                }}
                accessCode={accessCode}
                setAccessCode={setAccessCode}
                accessHint={accessHint}
                setAccessHint={setAccessHint}
                onConfirm={() => performPublish(editor)}
            />

            <LocationPickerDialog
                open={showLocationPicker}
                onOpenChange={(open) => {
                    setShowLocationPicker(open);
                    if (!open) { setIsFocused(true); editor?.commands.focus(); }
                }}
                onConfirm={(loc) => editor?.chain().focus().insertContent(loc + ' ').run()}
            />
        </motion.section>
    );
}
