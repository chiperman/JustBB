'use client';

import * as React from 'react';
import { MemoContent } from './MemoContent';
import { Pin, Lock, Share2, MoreHorizontal, MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MemoCardProps {
    memo: {
        id: string;
        memo_number: number;
        content: string;
        created_at: string;
        tags: string[];
        is_private: boolean;
        is_pinned: boolean;
        is_locked: boolean;
    };
}

export function MemoCard({ memo }: MemoCardProps) {
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
                    {memo.is_pinned && <Pin className="w-3.5 h-3.5 text-primary fill-primary" />}
                    {memo.is_private && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-md transition-all">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
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

            {/* 底部交互与标签 */}
            <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {memo.tags.map(tag => (
                        <span key={tag} className="text-xs text-primary bg-primary/5 px-2 py-0.5 rounded-full hover:bg-primary/10 cursor-pointer transition-colors">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MemoActions id={memo.id} isDeleted={!!memo.deleted_at} />
                </div>
            </div>

            {/* 锁定覆盖层 (可选) */}
            {memo.is_locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] rounded-2xl pointer-events-none">
                    <span className="bg-card border border-border px-4 py-2 rounded-full text-xs font-medium shadow-sm pointer-events-auto cursor-pointer hover:bg-muted transition-colors">
                        点击输入口令解锁
                    </span>
                </div>
            )}
        </article>
    );
}
