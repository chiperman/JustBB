'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createMemo } from '@/actions/memos';
import { useRouter } from 'next/navigation';
import { X, Pin, Lock, LockOpen, Hash, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { updateMemoContent } from '@/actions/update';
import { searchMemosForMention } from '@/actions/search';
import { Command, CommandList, CommandItem, CommandEmpty, CommandGroup } from './command';
import { getAllTags } from '@/actions/tags';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import CharacterCount from '@tiptap/extension-character-count';

// 建议项类型
interface SuggestionItem {
    id: string;
    label: string;
    subLabel?: string;
    count?: number;
    memo_number?: number;
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

interface MemoEditorProps {
    mode?: 'create' | 'edit';
    memo?: Memo;
    onCancel?: () => void;
    onSuccess?: () => void;
    isCollapsed?: boolean;
    hideFullscreen?: boolean;
}

export function MemoEditor({ mode = 'create', memo, onCancel, onSuccess, isCollapsed: isPropCollapsed = false, hideFullscreen = false }: MemoEditorProps) {
    const [content, setContent] = useState(memo?.content || '');
    const [tags, setTags] = useState<string[]>(memo?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [isPrivate, setIsPrivate] = useState(memo?.is_private || false);
    const [accessCode, setAccessCode] = useState('');
    const [accessHint, setAccessHint] = useState('');
    const [isPinned, setIsPinned] = useState(memo?.is_pinned || false);
    const [error, setError] = useState<string | null>(null);
    const [showPrivateDialog, setShowPrivateDialog] = useState(false);
    const [showAccessCode, setShowAccessCode] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // 计算最终是否收缩：属性要求收缩 且 未获得焦点 且 为创建模式 且 内容为空或未改变原始内容（或者强制收缩）
    const isActuallyCollapsed = isPropCollapsed && !isFocused && mode === 'create';

    // Suggestion system states
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Refs for Tiptap closures
    const suggestionsRef = useRef<SuggestionItem[]>([]);
    const selectedIndexRef = useRef(0);

    useEffect(() => {
        suggestionsRef.current = suggestions;
    }, [suggestions]);

    useEffect(() => {
        selectedIndexRef.current = selectedIndex;
    }, [selectedIndex]);

    // Tag autocomplete states
    const [allTags, setAllTags] = useState<TagStat[]>([]);
    const [tagSuggestions, setTagSuggestions] = useState<SuggestionItem[]>([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

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
            Placeholder.configure({
                placeholder: '有什么新鲜事？',
                emptyEditorClass: 'is-editor-empty',
            }),
            LinkExtension.configure({
                openOnClick: false,
            }),
            CharacterCount.configure({
                limit: 2000,
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'text-primary font-mono bg-primary/10 px-1 rounded-sm mx-0.5 inline-block decoration-none',
                },
                suggestion: {
                    char: '@',
                    render: () => {
                        return {
                            onStart: (props) => {
                                setSuggestions([]);
                                setSelectedIndex(0);
                                setShowSuggestions(true);
                                // 这里简化处理，实际可以通过 tippy.js 实现
                                searchMemosForMention(props.query).then(data => {
                                    const items = data.map(m => ({
                                        id: m.id,
                                        label: `@${m.memo_number}`,
                                        subLabel: m.content.substring(0, 50),
                                        memo_number: m.memo_number
                                    }));
                                    setSuggestions(items);
                                });
                            },
                            onUpdate: (props) => {
                                setSelectedIndex(0);
                                searchMemosForMention(props.query).then(data => {
                                    const items = data.map(m => ({
                                        id: m.id,
                                        label: `@${m.memo_number}`,
                                        subLabel: m.content.substring(0, 50),
                                        memo_number: m.memo_number
                                    }));
                                    setSuggestions(items);
                                });
                            },
                            onExit: () => {
                                setShowSuggestions(false);
                            },
                            onKeyDown: (props) => {
                                if (props.event.key === 'Escape') {
                                    setShowSuggestions(false);
                                    return true;
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
                                    if (item) {
                                        handleSelectSuggestion(item);
                                        props.event.preventDefault();
                                        return true;
                                    }
                                }

                                return false;
                            },
                        };
                    },
                },
            }),
        ],
        content: memo?.content || '',
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            setContent(text);
            setError(null);

            // 处理 #标签 建议触发
            const { from, to } = editor.state.selection;
            const textBefore = editor.state.doc.textBetween(Math.max(0, from - 20), from, ' ');
            const tagMatch = textBefore.match(/#(\S*)$/);

            if (tagMatch) {
                const query = tagMatch[1];
                const filtered = allTags
                    .filter(t => t.tag_name.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 5);
                setTagSuggestions(filtered.map(t => ({ id: t.tag_name, label: `#${t.tag_name}`, count: t.count })));
                setShowTagSuggestions(true);
            } else {
                setShowTagSuggestions(false);
            }
        },
        onFocus: () => setIsFocused(true),
        onBlur: () => setIsFocused(false),
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm max-w-none focus:outline-none text-foreground/80 leading-relaxed font-sans tracking-normal",
                    hideFullscreen ? "min-h-[650px]" : "min-h-[120px]",
                    isActuallyCollapsed ? "text-sm" : "text-base"
                ),
            },
        },
    });

    useEffect(() => {
        if (editor && memo?.content && mode === 'edit') {
            editor.commands.setContent(memo.content);
        }
    }, [editor, memo, mode]);

    const handleTagInputChange = (val: string) => {
        setTagInput(val);
        if (val.trim()) {
            const filtered = allTags
                .filter(t => t.tag_name.toLowerCase().includes(val.toLowerCase()))
                .slice(0, 5);
            setTagSuggestions(filtered.map(t => ({ id: t.tag_name, label: `#${t.tag_name}`, count: t.count })));
            setShowTagSuggestions(true);
        } else {
            setShowTagSuggestions(false);
        }
    };

    const handleSelectSuggestion = (item: SuggestionItem) => {
        if (!editor) return;

        editor
            .chain()
            .focus()
            .insertContent({
                type: 'mention',
                attrs: { id: item.memo_number, label: item.memo_number },
            })
            .insertContent(' ')
            .run();

        setShowSuggestions(false);
        setSelectedIndex(0);
    };

    const handleSelectTag = (item: SuggestionItem) => {
        const tag = item.id;
        if (!tags.includes(tag)) {
            setTags([...tags, tag]);
        }
        setTagInput('');
        setShowTagSuggestions(false);
    };

    const handleAddTag = () => {
        const tag = tagInput.trim().replace(/^#/, '');
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setTagInput('');
        }
        setShowTagSuggestions(false);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };


    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // cmdk 内置键盘导航，这里只处理 Enter 添加新标签和 Escape
        if (showTagSuggestions && e.key === 'Escape') {
            setShowTagSuggestions(false);
            return;
        }
        if (e.key === 'Enter' && !showTagSuggestions) {
            e.preventDefault();
            handleAddTag();
        }
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

        setIsPending(true);
        setError(null);
        setShowPrivateDialog(false);

        const formData = new FormData();
        formData.append('content', textContent);
        tags.forEach(tag => formData.append('tags', tag));
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
        <section className={cn(
            "bg-card border border-border rounded-sm transition-all duration-300 focus-within:shadow-md relative",
            isActuallyCollapsed ? "p-3 shadow-none" : "p-6 shadow-sm"
        )}>
            <div className="relative group">
                <label htmlFor="memo-content" className="sr-only">Memo内容</label>

                <div className={cn(
                    "overflow-y-auto scrollbar-hover relative",
                    hideFullscreen ? "max-h-none" : "max-h-[500px]"
                )}>
                    <EditorContent editor={editor} />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-full min-w-[280px]">
                        <div className="bg-popover border border-border rounded-sm shadow-xl overflow-hidden max-h-[300px] overflow-y-auto scrollbar-hover">
                            <ul className="p-1">
                                {suggestions.map((item, index) => (
                                    <li
                                        key={item.id}
                                        onClick={() => handleSelectSuggestion(item)}
                                        className={cn(
                                            "flex justify-between items-center gap-3 px-3 py-2 cursor-pointer rounded-sm outline-none transition-colors",
                                            index === selectedIndex
                                                ? "bg-accent text-accent-foreground"
                                                : "hover:bg-accent/50 text-foreground"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{item.label}</span>
                                            {item.subLabel && (
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {item.subLabel}
                                                </span>
                                            )}
                                        </div>
                                        {item.memo_number !== undefined && (
                                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                #{item.memo_number}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {!isActuallyCollapsed && (
                    <motion.div
                        initial={hideFullscreen ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        {/* 标签展示与录入区 */}
                        <div className="flex flex-wrap gap-2 items-center mt-2 min-h-[32px]">
                            {tags.map(tag => (
                                <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 bg-primary/5 text-primary text-xs px-2.5 py-1 rounded-sm group/tag animate-in zoom-in-95 duration-200"
                                >
                                    #{tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-red-500 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400 rounded-sm p-0.5"
                                        aria-label={`删除标签 #${tag}`}
                                    >
                                        <X className="w-2.5 h-2.5" aria-hidden="true" />
                                    </button>
                                </span>
                            ))}

                            <div className="relative">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-muted/40 border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all">
                                    <Hash className="w-3.5 h-3.5 text-muted-foreground/50" aria-hidden="true" />
                                    <input
                                        type="text"
                                        placeholder="添加标签..."
                                        value={tagInput}
                                        onChange={(e) => handleTagInputChange(e.target.value)}
                                        onKeyDown={handleTagInputKeyDown}
                                        className="bg-transparent border-none focus:ring-0 text-xs p-0 w-24 placeholder:text-muted-foreground/40"
                                        aria-label="添加标签"
                                    />
                                </div>
                                {showTagSuggestions && tagSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 mt-1 z-50">
                                        <Command className="min-w-[200px]">
                                            <CommandList>
                                                <CommandGroup>
                                                    {tagSuggestions.map((item) => (
                                                        <CommandItem
                                                            key={item.id}
                                                            value={item.label}
                                                            onSelect={() => handleSelectTag(item)}
                                                            className="flex justify-between items-center"
                                                        >
                                                            <span className="font-medium text-sm">{item.label}</span>
                                                            {item.count !== undefined && (
                                                                <span className="text-xs text-muted-foreground">{item.count}</span>
                                                            )}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="mt-3 text-xs text-red-500 bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10 animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-5 mt-4 border-t border-border">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleTogglePrivate}
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        isPrivate ? "text-primary bg-primary/5" : "text-muted-foreground"
                                    )}
                                    aria-label={isPrivate ? "设为公开内容" : "设为私密内容"}
                                    aria-pressed={isPrivate}
                                >
                                    {isPrivate ? <Lock className="w-3 h-3" aria-hidden="true" /> : <LockOpen className="w-3 h-3" aria-hidden="true" />}
                                    Private
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsPinned(!isPinned)}
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        isPinned ? "text-primary bg-primary/5" : "text-muted-foreground"
                                    )}
                                    aria-label={isPinned ? "取消置顶" : "置顶此内容"}
                                    aria-pressed={isPinned}
                                >
                                    <Pin className={cn("w-3 h-3", isPinned && "fill-primary")} aria-hidden="true" /> Pin
                                </Button>
                                {!isFullscreen && !hideFullscreen && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsFullscreen(true)}
                                        className="text-muted-foreground hover:text-primary transition-colors h-8 w-8 p-0"
                                        aria-label="全屏编辑"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                                <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-1">
                                    {content.trim().length} 字
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {mode === 'edit' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onCancel}
                                        className="rounded-sm text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        取消
                                    </Button>
                                )}
                                <Button
                                    onClick={handlePublishClick}
                                    disabled={isPending || !content.trim()}
                                    className={cn(
                                        "rounded-sm px-7",
                                        !shouldReduceMotion && "active:scale-95"
                                    )}
                                >
                                    {isPending ? (
                                        <>
                                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {mode === 'edit' ? '更新中...' : '发布中...'}
                                        </>
                                    ) : (
                                        mode === 'edit' ? '更新' : '发布'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent
                    className="max-w-5xl h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-background"
                    closeIcon={<Minimize2 className="h-4 w-4" />}
                    animateOffset={false}
                >
                    <DialogTitle className="sr-only">全屏编辑内容</DialogTitle>
                    <div className="flex-1 overflow-y-auto flex items-center justify-center px-6">
                        <div className="max-w-4xl w-full mx-auto flex flex-col min-h-[650px]">
                            <MemoEditor
                                mode={mode}
                                memo={memo}
                                isCollapsed={false}
                                hideFullscreen={true}
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
                            <label htmlFor="access-hint" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                口令提示 (可选)
                            </label>
                            <Input
                                id="access-hint"
                                type="text"
                                value={accessHint}
                                onChange={(e) => setAccessHint(e.target.value)}
                                placeholder="用于提示口令内容"
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setShowPrivateDialog(false)}
                            className="rounded-sm"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={performPublish}
                            disabled={isPending || !accessCode.trim()}
                            className={cn(
                                "rounded-sm px-7",
                                !shouldReduceMotion && "active:scale-95"
                            )}
                        >
                            {isPending ? '提交中...' : '确认发布'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}

