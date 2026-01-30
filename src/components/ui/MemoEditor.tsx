'use client';

import { useState } from 'react';
import { createMemo } from '@/actions/memos';
import { useRouter } from 'next/navigation';

export function MemoEditor() {
    const [content, setContent] = useState('');
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handlePublish = async () => {
        if (!content.trim() || isPending) return;

        setIsPending(true);
        const formData = new FormData();
        formData.append('content', content);
        // 默认非私密、非置顶
        formData.append('is_private', 'false');
        formData.append('is_pinned', 'false');

        const result = await createMemo(formData);

        if (result.success) {
            setContent('');
            router.refresh(); // 刷新页面数据
        } else {
            alert(typeof result.error === 'string' ? result.error : '发布失败');
        }
        setIsPending(false);
    };

    return (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <textarea
                className="w-full bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground italic text-sm resize-none"
                placeholder="记录此刻的灵感..."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
            />
            <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-2">
                    {/* 以后在这里添加标签选择、私密切换等 */}
                    <span className="text-xs text-muted-foreground cursor-help" title="标签功开发中">#添加标签</span>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={isPending || !content.trim()}
                    className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isPending ? '发布中...' : '发布'}
                </button>
            </div>
        </section>
    );
}
