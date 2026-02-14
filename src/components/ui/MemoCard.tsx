'use client';

import { MemoContent } from './MemoContent';
import { MemoActions } from './MemoActions';
import { MemoEditor } from './MemoEditor';
import { Pin, Lock, MoreHorizontal, Link2 } from 'lucide-react';
import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatDate } from '@/lib/utils';
import { useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';

import { Memo } from '@/types/memo';
import { UnlockDialog } from './UnlockDialog';

interface MemoCardProps {
    memo: Memo;
    isEditing?: boolean;
    onEditChange?: (editing: boolean) => void;
}

export const MemoCard = memo(function MemoCard({ memo, isEditing, onEditChange }: MemoCardProps) {
    const router = useRouter();
    const [isUnlockOpen, setIsUnlockOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const shouldReduceMotion = useReducedMotion();

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
            <article className="bg-card border border-border rounded-sm p-6 shadow-md ring-2 ring-primary/20 animate-in fade-in duration-200">
                <MemoEditor
                    mode="edit"
                    memo={memo}
                    contextMemos={[memo]} // 编辑模式下至少包含当前 memo，通常这种模式也会有外层 context 传入但目前保持独立
                    onCancel={() => onEditChange?.(false)}
                    onSuccess={() => onEditChange?.(false)}
                />
            </article>
        );
    }

    return (
        <article className={cn(
            "relative bg-card rounded-sm p-6 transition-all border border-border focus-within:ring-2 focus-within:ring-primary/10",
            memo.is_pinned && "bg-primary/5 border-primary/20"
        )}>
            {/* 顶部元信息 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-sm">
                        #{memo.memo_number}
                    </span>
                    <time className="text-xs text-muted-foreground font-sans">
                        {new Date(memo.created_at).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        }).replace(/\//g, '-')}
                    </time>
                    {memo.is_pinned && <Pin className="w-3.5 h-3.5 text-primary fill-primary" aria-hidden="true" />}
                    {memo.is_private && <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />}
                    {memo.word_count !== undefined && (
                        <span className="text-[10px] text-muted-foreground/60">
                            {memo.word_count} 字
                        </span>
                    )}
                </div>
                {!memo.is_locked && (
                    <div className="flex items-center gap-2 group">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleBacklinks}
                            className={cn(
                                "h-8 w-8 rounded-sm transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                                showBacklinks ? "bg-primary/10 text-primary opacity-100" : "text-muted-foreground",
                                (showBacklinks || isMenuOpen) && "opacity-100",
                            )}
                            aria-expanded={showBacklinks}
                            aria-label="查看引用"
                            title="查看引用"
                        >
                            <Link2 className="w-4 h-4" />
                        </Button>
                        <MemoActions
                            id={memo.id}
                            isDeleted={!!memo.deleted_at}
                            isPinned={memo.is_pinned}
                            isPrivate={memo.is_private}
                            content={memo.content}
                            createdAt={memo.created_at}
                            tags={memo.tags ?? []}
                            onEdit={() => onEditChange?.(true)}
                            onOpenChange={setIsMenuOpen}
                        />
                    </div>
                )}
            </div>

            {/* 内容区域 */}
            <div className={cn(
                "w-full transition-all",
                memo.is_locked && "blur-sm select-none"
            )}>
                {memo.is_locked ? (
                    <div className="text-base leading-relaxed text-muted-foreground italic opacity-60">这一条私密记录已被锁定，输入口令后即可解锁阅读。</div>
                ) : (
                    <MemoContent content={memo.content} />
                )}
            </div>

            {/* 引用展示区 */}
            {showBacklinks && (
                <div
                    className="mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-1 duration-200"
                    id={`backlinks-${memo.id}`}
                    role="region"
                    aria-label="反向引用列表"
                >
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <span className="w-1 h-3 bg-primary/30 rounded-full" />
                        Refered by:
                    </p>
                    {loadingBacklinks ? (
                        <div className="text-xs text-muted-foreground animate-pulse">Loading references...</div>
                    ) : backlinks.length > 0 ? (
                        <div className="space-y-2">
                            {backlinks.map(link => (
                                <div key={link.id} className="text-xs bg-muted/30 p-2 rounded-sm flex justify-between items-center group/link hover:bg-accent transition-colors">
                                    <span className="text-muted-foreground truncate max-w-[200px]">{link.content.substring(0, 30)}...</span>
                                    <a
                                        href={`/?q=${link.memo_number}`}
                                        className="text-primary font-mono font-medium hover:underline focus-visible:ring-1 focus-visible:ring-primary/40 rounded px-1"
                                    >
                                        #{link.memo_number}
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground italic">No references found.</div>
                    )}
                </div>
            )}

            {/* 底部交互与标签 */}


            {/* 锁定覆盖层 */}
            {memo.is_locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] rounded-sm pointer-events-none z-10">
                    <button
                        onClick={handleUnlock}
                        className={cn(
                            "bg-card px-5 py-2.5 rounded-sm text-xs font-medium shadow-md pointer-events-auto cursor-pointer hover:bg-accent hover:shadow-lg transition-all flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ring-offset-2",
                            !shouldReduceMotion && "active:scale-95"
                        )}
                        aria-label="解密内容"
                    >
                        <Lock className="w-3 h-3 text-primary" aria-hidden="true" />
                        <span>解密记录以阅读正文</span>
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
});
