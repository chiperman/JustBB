'use client';

import { useState, useRef, useEffect } from 'react';
import { createMemo } from '@/actions/memos';
import { useRouter } from 'next/navigation';
import { X, Pin, Lock, LockOpen, Hash, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateMemoContent } from '@/actions/update';
import { searchMemosForMention } from '@/actions/search';
import { SuggestionList, SuggestionItem } from './SuggestionList';
import { getAllTags } from '@/actions/tags';
import { useReducedMotion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

import { Memo, TagStat } from '@/types/memo';

interface MemoEditorProps {
    mode?: 'create' | 'edit';
    memo?: Memo;
    onCancel?: () => void;
    onSuccess?: () => void;
}

export function MemoEditor({ mode = 'create', memo, onCancel, onSuccess }: MemoEditorProps) {
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

    // Suggestion system states
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Tag autocomplete states
    const [allTags, setAllTags] = useState<TagStat[]>([]);
    const [tagSuggestions, setTagSuggestions] = useState<SuggestionItem[]>([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    const shouldReduceMotion = useReducedMotion();
    const router = useRouter();

    // 自动调整 textarea 高度
    const autoResize = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // 重置高度以获取正确的 scrollHeight
        textarea.style.height = 'auto';
        // 设置新高度，最小 60px，最大 300px
        const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 300);
        textarea.style.height = `${newHeight}px`;
    };

    useEffect(() => {
        autoResize();
    }, [content]);

    useEffect(() => {
        getAllTags().then(setAllTags);
    }, []);

    const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        setError(null);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPosition);
        // 匹配 @ 后跟任意非空白字符（支持编号和内容搜索）
        const mentionMatch = textBeforeCursor.match(/@(\S*)$/);

        if (mentionMatch) {
            const query = mentionMatch[1];
            setShowSuggestions(true);
            const data = await searchMemosForMention(query);
            setSuggestions(data.map(m => ({
                id: m.id,
                label: `@${m.memo_number}`,
                subLabel: m.content.substring(0, 50),
                memo_number: m.memo_number
            })));
            setActiveIndex(0);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleTagInputChange = (val: string) => {
        setTagInput(val);
        if (val.trim()) {
            const filtered = allTags
                .filter(t => t.tag_name.toLowerCase().includes(val.toLowerCase()))
                .slice(0, 5);
            setTagSuggestions(filtered.map(t => ({ id: t.tag_name, label: `#${t.tag_name}`, count: t.count })));
            setShowTagSuggestions(true);
            setActiveIndex(0);
        } else {
            setShowTagSuggestions(false);
        }
    };

    const handleSelectSuggestion = (item: SuggestionItem) => {
        if (!textareaRef.current) return;
        const cursorPosition = textareaRef.current.selectionStart;
        const textBeforeCursor = content.slice(0, cursorPosition);
        const textAfterCursor = content.slice(cursorPosition);

        // 替换 @ 后跟的所有非空白字符为正确的编号
        const newPrefix = textBeforeCursor.replace(/@\S*$/, `@${item.memo_number} `);
        setContent(newPrefix + textAfterCursor);
        setShowSuggestions(false);
        textareaRef.current.focus();
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handlePublishClick();
            return;
        }

        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelectSuggestion(suggestions[activeIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showTagSuggestions && tagSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % tagSuggestions.length);
                return;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + tagSuggestions.length) % tagSuggestions.length);
                return;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelectTag(tagSuggestions[activeIndex]);
                return;
            } else if (e.key === 'Escape') {
                setShowTagSuggestions(false);
                return;
            }
        }

        if (e.key === 'Enter') {
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
        setIsPending(true);
        setError(null);
        setShowPrivateDialog(false);

        const formData = new FormData();
        formData.append('content', content);
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

    // 渲染带高亮的内容
    const renderHighlightedContent = () => {
        // 匹配 @数字 格式的引用
        const parts = content.split(/(@\d+)/g);
        return parts.map((part, index) => {
            if (/^@\d+$/.test(part)) {
                return <mark key={index} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-all focus-within:shadow-md relative">
            <div className="relative group">
                <label htmlFor="memo-content" className="sr-only">Memo内容</label>
                {/* 高亮层：显示 @引用 高亮 */}
                <div
                    className="absolute inset-0 w-full text-lg leading-relaxed p-0 font-serif pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
                    style={{ height: textareaRef.current?.style.height || '60px' }}
                    aria-hidden="true"
                >
                    {renderHighlightedContent()}
                </div>
                <textarea
                    id="memo-content"
                    ref={textareaRef}
                    placeholder="有什么新鲜事？"
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none focus:ring-0 text-lg leading-relaxed resize-none p-0 placeholder:text-muted-foreground/30 font-serif overflow-hidden relative text-transparent caret-foreground"
                    style={{ height: '60px' }}
                />

                {showSuggestions && (
                    <div className="absolute top-full left-0 mt-1 z-50">
                        <SuggestionList
                            items={suggestions}
                            activeIndex={activeIndex}
                            onSelect={handleSelectSuggestion}
                        />
                    </div>
                )}
            </div>

            {/* 标签展示与录入区 */}
            <div className="flex flex-wrap gap-2 items-center mt-2 min-h-[32px]">
                {tags.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-primary/5 text-primary text-xs px-2.5 py-1 rounded-full group/tag animate-in zoom-in-95 duration-200"
                    >
                        #{tag}
                        <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400 rounded-full p-0.5"
                            aria-label={`删除标签 #${tag}`}
                        >
                            <X className="w-2.5 h-2.5" aria-hidden="true" />
                        </button>
                    </span>
                ))}

                <div className="relative">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 border border-transparent focus-within:border-primary/20 focus-within:bg-background transition-all">
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
                    {showTagSuggestions && (
                        <div className="absolute top-full left-0 mt-1 z-50">
                            <SuggestionList
                                items={tagSuggestions}
                                activeIndex={activeIndex}
                                onSelect={handleSelectTag}
                            />
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
                    <button
                        onClick={handleTogglePrivate}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 p-1.5 rounded-md cursor-pointer",
                            isPrivate ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-muted"
                        )}
                        aria-label={isPrivate ? "设为公开内容" : "设为私密内容"}
                        aria-pressed={isPrivate}
                    >
                        {isPrivate ? <Lock className="w-3 h-3" aria-hidden="true" /> : <LockOpen className="w-3 h-3" aria-hidden="true" />}
                        Private
                    </button>
                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 p-1.5 rounded-md cursor-pointer",
                            isPinned ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-muted"
                        )}
                        aria-label={isPinned ? "取消置顶" : "置顶此内容"}
                        aria-pressed={isPinned}
                    >
                        <Pin className={cn("w-3 h-3", isPinned && "fill-primary")} aria-hidden="true" /> Pin
                    </button>
                </div>
                <div className="flex gap-3">
                    {mode === 'edit' && (
                        <button
                            onClick={onCancel}
                            className="text-muted-foreground px-5 py-2 rounded-full text-sm font-medium hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/10 cursor-pointer"
                        >
                            取消
                        </button>
                    )}
                    <button
                        onClick={handlePublishClick}
                        disabled={isPending || !content.trim()}
                        className={cn(
                            "bg-primary text-white px-7 py-2.5 rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed",
                            !isPending && content.trim() && "hover:opacity-90 hover:shadow-md",
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
                    </button>
                </div>
            </div>

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
                                <input
                                    id="access-code"
                                    type={showAccessCode ? "text" : "password"}
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    placeholder="请输入访问口令"
                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAccessCode(!showAccessCode)}
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    aria-label={showAccessCode ? "隐藏口令" : "显示口令"}
                                >
                                    {showAccessCode ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="access-hint" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                口令提示 (可选)
                            </label>
                            <input
                                id="access-hint"
                                type="text"
                                value={accessHint}
                                onChange={(e) => setAccessHint(e.target.value)}
                                placeholder="用于提示口令内容"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end gap-2">
                        <button
                            onClick={() => setShowPrivateDialog(false)}
                            className="text-muted-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/10"
                        >
                            取消
                        </button>
                        <button
                            onClick={performPublish}
                            disabled={isPending || !accessCode.trim()}
                            className={cn(
                                "bg-primary text-white px-7 py-2.5 rounded-full text-sm font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                                !isPending && accessCode.trim() && "hover:opacity-90 hover:shadow-md",
                                !shouldReduceMotion && "active:scale-95"
                            )}
                        >
                            {isPending ? '提交中...' : '确认发布'}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}

