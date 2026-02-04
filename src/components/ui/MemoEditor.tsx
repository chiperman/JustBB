'use client';

import { useState } from 'react';
import { createMemo } from '@/actions/memos';
import { useRouter } from 'next/navigation';
import { Tag, X, Pin, Lock, LockOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateMemoContent } from '@/actions/update';

interface MemoEditorProps {
    mode?: 'create' | 'edit';
    memo?: {
        id: string;
        content: string;
        tags: string[];
        is_private: boolean;
        is_pinned: boolean;
    };
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
    const router = useRouter();

    const handleAddTag = () => {
        const tag = tagInput.trim();
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm transition-all focus-within:shadow-md">
            <textarea
                className="w-full bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground italic text-sm resize-none mb-2"
                placeholder="记录此刻的灵感..."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handlePublish();
                    }
                }}
                disabled={isPending}
            />

            {/* 标签展示区 */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            #{tag}
                            <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* 标签输入框 */}
            {isTagInputVisible && (
                <div className="flex items-center gap-2 mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                        placeholder="输入标签并回车..."
                        className="text-xs bg-muted/50 border border-border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary w-32"
                        autoFocus
                        onBlur={() => {
                            if (tagInput.trim()) handleAddTag();
                        }}
                    />
                </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsTagInputVisible(!isTagInputVisible)}
                        className={cn("text-xs flex items-center gap-1 transition-colors", isTagInputVisible ? "text-primary" : "text-muted-foreground hover:text-primary")}
                        title="添加标签"
                    >
                        <Tag className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsPrivate(!isPrivate)}
                        className={cn("text-xs flex items-center gap-1 transition-colors", isPrivate ? "text-primary" : "text-muted-foreground hover:text-primary")}
                        title={isPrivate ? "私密内容" : "公开内容"}
                    >
                        {isPrivate ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className={cn("text-xs flex items-center gap-1 transition-colors", isPinned ? "text-primary" : "text-muted-foreground hover:text-primary")}
                        title={isPinned ? "已置顶" : "置顶"}
                    >
                        <Pin className="w-4 h-4" />
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
