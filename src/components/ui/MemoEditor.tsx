'use client';

import { useState } from 'react';
import { createMemo } from '@/actions/memos';
import { useRouter } from 'next/navigation';
import { Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';;

export function MemoEditor() {
    const [content, setContent] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [isTagInputVisible, setIsTagInputVisible] = useState(false);
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

        // 处理标签
        tags.forEach(tag => formData.append('tags', tag));

        // 默认非私密、非置顶
        formData.append('is_private', 'false');
        formData.append('is_pinned', 'false');

        const result = await createMemo(formData);

        if (result.success) {
            setContent('');
            setTags([]);
            setIsTagInputVisible(false);
            router.refresh();
        } else {
            alert(typeof result.error === 'string' ? result.error : '发布失败');
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
                            // 延时关闭以允许点击发生
                            // setTagInput(''); 
                            // setIsTagInputVisible(false); 
                        }}
                    />
                </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsTagInputVisible(!isTagInputVisible)}
                        className={cn("text-xs flex items-center gap-1 transition-colors", isTagInputVisible ? "text-primary" : "text-muted-foreground hover:text-primary")}
                        title="添加标签"
                    >
                        <Tag className="w-3.5 h-3.5" />
                        <span>标签</span>
                    </button>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={isPending || !content.trim()}
                    className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                    {isPending ? '发布中...' : '发布'}
                </button>
            </div>
        </section>
    );
}
