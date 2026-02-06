'use client';

import { useState, useRef, useEffect } from 'react';
import { createMemo } from '@/actions/memos';
import { useRouter } from 'next/navigation';
import { Tag, X, Pin, Lock, LockOpen, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateMemoContent } from '@/actions/update';
import { searchMemosForMention } from '@/actions/search';
import { SuggestionList } from './SuggestionList';
import { getAllTags } from '@/actions/tags';

import { Memo } from '@/types/memo';

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
    const [isTagInputVisible, setIsTagInputVisible] = useState(false);
    const [isPrivate, setIsPrivate] = useState(memo?.is_private || false);
    const [isPinned, setIsPinned] = useState(memo?.is_pinned || false);

    // Suggestion system states
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Tag autocomplete states
    const [allTags, setAllTags] = useState<{ tag_name: string, count: number }[]>([]);
    const [tagSuggestions, setTagSuggestions] = useState<any[]>([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (isTagInputVisible) {
            getAllTags().then(setAllTags);
        }
    }, [isTagInputVisible]);

    const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\d*)$/);

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

    const handleSelectSuggestion = (item: any) => {
        if (!textareaRef.current) return;
        const cursorPosition = textareaRef.current.selectionStart;
        const textBeforeCursor = content.slice(0, cursorPosition);
        const textAfterCursor = content.slice(cursorPosition);

        const newPrefix = textBeforeCursor.replace(/@\d*$/, `@${item.memo_number} `);
        setContent(newPrefix + textAfterCursor);
        setShowSuggestions(false);
        textareaRef.current.focus();
    };

    const handleSelectTag = (item: any) => {
        const tag = item.id;
        if (!tags.includes(tag)) {
            setTags([...tags, tag]);
        }
        setTagInput('');
        setShowTagSuggestions(false);
    };

    const handleAddTag = () => {
        const tag = tagInput.trim();
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
            handlePublish();
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

    const handlePublish = async () => {
        if (!content.trim() || isPending) return;

        setIsPending(true);
        const formData = new FormData();
        formData.append('content', content);
        tags.forEach(tag => formData.append('tags', tag));
        formData.append('is_private', String(isPrivate));
        formData.append('is_pinned', String(isPinned));

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
                setIsPinned(false);
                setIsTagInputVisible(false);
                router.refresh();
            } else {
                onSuccess?.();
                router.refresh();
            }
        } else {
            alert(typeof result.error === 'string' ? result.error : '操作失败');
        }
        setIsPending(false);
    };

    return (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-all focus-within:shadow-md relative">
            <div className="relative group">
                <label htmlFor="memo-content" className="sr-only">Memo内容</label>
                <textarea
                    id="memo-content"
                    ref={textareaRef}
                    placeholder="有什么新鲜事？"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent border-none focus:ring-0 text-lg leading-relaxed resize-none p-0 placeholder:text-muted-foreground/40 font-serif"
                    rows={mode === 'edit' ? 8 : 4}
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

            {/* 标签展示区 */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 bg-primary/5 text-primary text-xs px-2 py-1 rounded-full group/tag animate-in zoom-in-95 duration-200">
                            #{tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-red-500 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400 rounded-full"
                                aria-label={`删除标签 #${tag}`}
                            >
                                <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                        </span>
                    ))}
                    <div className="relative">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all">
                            <Hash className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                            <input
                                type="text"
                                placeholder="添加标签..."
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagInputKeyDown}
                                className="bg-transparent border-none focus:ring-0 text-xs p-0 w-20 placeholder:text-muted-foreground/50"
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
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsPrivate(!isPrivate)}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 p-1 rounded",
                            isPrivate ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                        aria-label={isPrivate ? "设为公开内容" : "设为私密内容"}
                    >
                        {isPrivate ? <Lock className="w-3 h-3" aria-hidden="true" /> : <LockOpen className="w-3 h-3" aria-hidden="true" />}
                        Private
                    </button>
                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 p-1 rounded",
                            isPinned ? "text-primary" : "text-muted-foreground hover:text-primary"
                        )}
                        aria-label={isPinned ? "取消置顶" : "置顶此内容"}
                    >
                        <Pin className="w-3 h-3" aria-hidden="true" /> Pin
                    </button>
                </div>
                <div className="flex gap-2">
                    {mode === 'edit' && (
                        <button
                            onClick={onCancel}
                            className="text-muted-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-muted transition-colors"
                        >
                            取消
                        </button>
                    )}
                    <button
                        onClick={handlePublish}
                        disabled={isPending || !content.trim()}
                        className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPending ? (mode === 'edit' ? '更新中...' : '发布中...') : (mode === 'edit' ? '更新' : '发布')}
                    </button>
                </div>
            </div>
        </section>
    );
}
