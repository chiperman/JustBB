'use client';

import { MemoContent } from './MemoContent';
import { MemoActions } from './MemoActions';
import { MemoEditor } from './MemoEditor';
import { Pin, Lock, Share2, MoreHorizontal, MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useRouter, useSearchParams } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { Memo } from '@/types/memo';
import { UnlockDialog } from './UnlockDialog';

interface MemoCardProps {
    memo: Memo;
}

export function MemoCard({ memo }: MemoCardProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isUnlockOpen, setIsUnlockOpen] = useState(false);

    const handleUnlock = () => {
        setIsUnlockOpen(true);
    };

    const [showBacklinks, setShowBacklinks] = useState(false);
    const [backlinks, setBacklinks] = useState<Memo[]>([]);
    const [loadingBacklinks, setLoadingBacklinks] = useState(false);

    const toggleBacklinks = async () => {
        if (!showBacklinks && backlinks.length === 0) {
            setLoadingBacklinks(true);
            const { getBacklinks } = await import('@/actions/references');
            const data = await getBacklinks(memo.memo_number);
            setBacklinks(data);
            setLoadingBacklinks(false);
        }
        setShowBacklinks(!showBacklinks);
    };

    if (isEditing) {
        return (
            <article className="bg-card border border-border rounded-2xl p-6 shadow-md ring-2 ring-primary/20">
                <MemoEditor
                    mode="edit"
                    memo={memo}
                    onCancel={() => setIsEditing(false)}
                    onSuccess={() => setIsEditing(false)}
                />
            </article>
        );
    }

    return (
        <article className={cn(
            "group relative bg-card border border-border rounded-2xl p-6 transition-all hover:shadow-md",
            memo.is_pinned && "border-primary/30 bg-primary/5"
        )}>
            {/* 顶部元信息 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        #{memo.memo_number}
                    </span>
                    <time className="text-xs text-muted-foreground font-sans">
                        {new Date(memo.created_at).toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </time>
                    {memo.is_pinned && <Pin className="w-3.5 h-3.5 text-primary fill-primary" aria-hidden="true" />}
                    {memo.is_private && <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleBacklinks}
                        className={cn(
                            "text-xs px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                            showBacklinks ? "bg-primary/10 text-primary opacity-100" : "text-muted-foreground hover:bg-muted"
                        )}
                        aria-expanded={showBacklinks}
                        aria-label="查看引用"
                        title="查看引用"
                    >
                        refs
                    </button>
                    <button
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 hover:bg-muted rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        aria-label="更多操作"
                    >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* 内容区域 */}
            {/* 内容区域 */}
            <div className={cn(
                "w-full",
                memo.is_locked && "blur-sm select-none"
            )}>
                {memo.is_locked ? (
                    <div className="text-base leading-relaxed text-muted-foreground">这一条私密记录已被锁定，输入口令后即可解锁阅读。</div>
                ) : (
                    <MemoContent content={memo.content} />
                )}
            </div>

            {/* 引用展示区 */}
            {showBacklinks && (
                <div className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-1">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Refers to this:</p>
                    {loadingBacklinks ? (
                        <div className="text-xs text-muted-foreground">Loading...</div>
                    ) : backlinks.length > 0 ? (
                        <div className="space-y-2">
                            {backlinks.map(link => (
                                <div key={link.id} className="text-xs bg-muted/30 p-2 rounded flex justify-between items-center group/link">
                                    <span className="text-muted-foreground truncate max-w-[200px]">{link.content.substring(0, 30)}...</span>
                                    <a href={`/?q=${link.memo_number}`} className="text-primary hover:underline">#{link.memo_number}</a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground italic">No references found.</div>
                    )}
                </div>
            )}

            {/* 底部交互与标签 */}
            <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {memo.tags?.map(tag => (
                        <span key={tag} className="text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-full hover:bg-primary/10 cursor-pointer transition-colors">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <MemoActions
                        id={memo.id}
                        isDeleted={!!memo.deleted_at}
                        isPinned={memo.is_pinned}
                        isPrivate={memo.is_private}
                        content={memo.content}
                        createdAt={memo.created_at}
                        tags={memo.tags ?? []}
                        onEdit={() => setIsEditing(true)}
                    />
                </div>
            </div>

            {/* 锁定覆盖层 (可选) */}
            {memo.is_locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] rounded-2xl pointer-events-none z-10">
                    <button
                        onClick={handleUnlock}
                        className="bg-card border border-border px-4 py-2 rounded-full text-xs font-medium shadow-sm pointer-events-auto cursor-pointer hover:bg-muted transition-colors flex items-center gap-2"
                    >
                        <Lock className="w-3 h-3" aria-hidden="true" />
                        点击输入口令解锁
                    </button>
                </div>
            )}

            <UnlockDialog
                isOpen={isUnlockOpen}
                onClose={() => setIsUnlockOpen(false)}
                hint={memo.access_code_hint}
            />
        </article>
    );
}
