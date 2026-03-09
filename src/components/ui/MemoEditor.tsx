'use client';

import { useRef, useEffect, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Minimize01Icon as Minimize2 } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import { motion } from 'framer-motion';

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { spring, ease, duration } from '@/lib/animation';

import { EditorSuggestionMenu } from './EditorSuggestionMenu';
import { MemoPrivateDialog } from './MemoPrivateDialog';
import { LocationPickerDialog } from './LocationPickerDialog';
import { EditorToolbar } from './editor/EditorToolbar';
import { getExtensions, textToTiptapHtml } from './editor/extensions';

import { useMemoEditor, DRAFT_CONTENT_KEY } from '@/hooks/useMemoEditor';
import { useEditorSuggestions, CustomSuggestionProps } from '@/hooks/useEditorSuggestions';
import { Memo } from '@/types/memo';

interface MemoEditorProps {
    mode?: 'create' | 'edit';
    memo?: Memo;
    onCancel?: () => void;
    onSuccess?: (memo?: Memo) => void;
    isCollapsed?: boolean;
    hideFullscreen?: boolean;
    className?: string;
}

export function MemoEditor({
    mode = 'create',
    memo,
    onCancel,
    onSuccess,
    isCollapsed: isPropCollapsed = false,
    hideFullscreen = false,
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
        isFullscreen, setIsFullscreen,
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

    // 计算最终是否收缩
    const isActuallyCollapsed = isPropCollapsed && !isFocused && mode === 'create';

    const extensions = useMemo(() => 
        // eslint-disable-next-line react-hooks/refs
        getExtensions({
        onMentionStart: (props) => {
            suggestionPropsRef.current = props;
            setShowSuggestions(true);
            fetchMentionSuggestions(props.query, 0);
            updateSuggestionPosition(props, relativeGroupRef);
        },
        onMentionUpdate: (props) => {
            suggestionPropsRef.current = props;
            fetchMentionSuggestions(props.query, 0);
            updateSuggestionPosition(props, relativeGroupRef);
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
            updateSuggestionPosition(props, relativeGroupRef);
        },
        onHashtagUpdate: (props) => {
            suggestionPropsRef.current = props;
            fetchHashtagSuggestions(props.query);
            updateSuggestionPosition(props, relativeGroupRef);
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
        relativeGroupRef,
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
                    hideFullscreen ? "flex-1 min-h-full px-1 focus:outline-none" : "min-h-[120px]",
                    "text-base"
                ),
            },
        },
    });

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

    // Fullscreen Sync Effect
    useEffect(() => {
        if (!hideFullscreen && !isFullscreen && mode === 'create' && editor) {
            const draftContent = localStorage.getItem(DRAFT_CONTENT_KEY);
            if (draftContent !== null) {
                try {
                    editor.commands.setContent(JSON.parse(draftContent));
                } catch {
                    editor.commands.setContent(draftContent);
                }
                setContent(editor.getText());
            }
        }
    }, [isFullscreen, hideFullscreen, mode, editor, setContent]);

    return (
        <motion.section
            initial={false}
            animate={{
                opacity: 1,
                height: isActuallyCollapsed ? "auto" : (hideFullscreen ? "100%" : "auto"),
                minHeight: isActuallyCollapsed ? 0 : (hideFullscreen ? "100%" : 120),
                padding: 24,
                boxShadow: isActuallyCollapsed ? "none" : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
            }}
            exit={{
                opacity: 0,
                height: 0,
                transition: { opacity: { duration: 0.2 }, height: { duration: 0.3 } }
            }}
            transition={{
                height: isActuallyCollapsed ? spring.default : { duration: duration.default, ease: ease.out },
                opacity: { duration: duration.fast }
            }}
            onAnimationStart={() => setIsAnimating(true)}
            onAnimationComplete={() => setIsAnimating(false)}
            style={{
                willChange: "transform, height, opacity",
                overflow: (isActuallyCollapsed || isAnimating) ? 'hidden' : 'visible'
            }}
            className={cn(
                "border border-border rounded-inner relative flex flex-col items-stretch selection:bg-primary/30",
                isActuallyCollapsed ? "shadow-none cursor-pointer hover:bg-accent/5" : (hideFullscreen ? "h-full" : ""),
                className
            )}
            onClick={() => {
                if ((isActuallyCollapsed || hideFullscreen) && editor) {
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
                            height: isActuallyCollapsed ? 26 : (hideFullscreen ? "100%" : "auto"),
                            minHeight: isActuallyCollapsed ? 0 : (hideFullscreen ? "100%" : 120),
                        }}
                        className={cn(
                            "relative",
                            isActuallyCollapsed ? "min-h-0 scrollbar-hide overflow-hidden" : (hideFullscreen ? "overflow-y-auto scrollbar-hover flex-1" : "overflow-visible")
                        )}
                        style={{
                            maxHeight: hideFullscreen ? 'none' : 500,
                            maskImage: isActuallyCollapsed ? 'linear-gradient(to bottom, black 90%, transparent 100%)' : 'none',
                        }}
                    >
                        {!editor && (
                            <div className="tiptap prose prose-sm max-w-none text-muted-foreground/50 absolute inset-0 pointer-events-none">
                                <p>Wanna memo something? JustMemo it!</p>
                            </div>
                        )}
                        <EditorContent editor={editor} className={cn("flex-1 flex flex-col min-h-0", hideFullscreen && "h-full")} />
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
                    isFullscreenAvailable={!hideFullscreen}
                    content={content}
                    mode={mode}
                    onTogglePrivate={handleTogglePrivate}
                    onTogglePinned={() => setIsPinned(!isPinned)}
                    onShowLocationPicker={() => setShowLocationPicker(true)}
                    onShowFullscreen={() => setIsFullscreen(true)}
                    onCancel={handleCancel}
                    onPublish={() => isPrivate ? setShowPrivateDialog(true) : performPublish(editor)}
                />
            </div>

            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent
                    className="max-w-5xl h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background"
                    closeIcon={<HugeiconsIcon icon={Minimize2} size={16} />}
                >
                    <DialogTitle className="sr-only">全屏编辑内容</DialogTitle>
                    <div className="flex-1 overflow-visible flex items-stretch justify-center px-6 py-10 bg-black/5">
                        <div className="max-w-4xl w-full mx-auto flex flex-col h-full [min-height:0]">
                            <MemoEditor
                                mode={mode}
                                memo={memo}
                                isCollapsed={false}
                                hideFullscreen={true}
                                onCancel={() => setIsFullscreen(false)}
                                onSuccess={() => setIsFullscreen(false)}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <MemoPrivateDialog
                open={showPrivateDialog}
                onOpenChange={setShowPrivateDialog}
                accessCode={accessCode}
                setAccessCode={setAccessCode}
                accessHint={accessHint}
                setAccessHint={setAccessHint}
                onConfirm={() => performPublish(editor)}
            />

            <LocationPickerDialog
                open={showLocationPicker}
                onOpenChange={setShowLocationPicker}
                onConfirm={(loc) => editor?.chain().focus().insertContent(loc + ' ').run()}
            />
        </motion.section>
    );
}
