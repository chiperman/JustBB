'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    PinIcon as Pin,
    LockIcon as Lock,
    CircleUnlock01Icon as LockOpen,
    Maximize01Icon as Maximize2,
    Location04Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { spring, ease, duration } from '@/lib/animation';

interface EditorToolbarProps {
    isActuallyCollapsed: boolean;
    isPrivate: boolean;
    isPinned: boolean;
    isPending: boolean;
    isFullscreenAvailable: boolean;
    content: string;
    mode: 'create' | 'edit';
    onTogglePrivate: () => void;
    onTogglePinned: () => void;
    onShowLocationPicker: () => void;
    onShowFullscreen: () => void;
    onCancel: () => void;
    onPublish: () => void;
}

export function EditorToolbar({
    isActuallyCollapsed,
    isPrivate,
    isPinned,
    isPending,
    isFullscreenAvailable,
    content,
    mode,
    onTogglePrivate,
    onTogglePinned,
    onShowLocationPicker,
    onShowFullscreen,
    onCancel,
    onPublish
}: EditorToolbarProps) {
    return (
        <motion.div
            initial={false}
            animate={{
                height: isActuallyCollapsed ? 0 : "auto",
                opacity: isActuallyCollapsed ? 0 : 1,
            }}
            transition={{
                height: isActuallyCollapsed ? spring.default : { duration: duration.default, ease: ease.out },
                opacity: { duration: duration.fast }
            }}
            style={{ willChange: "opacity, height" }}
            className="overflow-hidden bg-transparent"
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className="pt-5 mt-4 border-t border-border/50 flex justify-between items-center">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onTogglePrivate}
                        className={cn("h-8 px-2 gap-1.5 active:scale-95 transition-all text-muted-foreground", isPrivate ? "text-primary bg-primary/5 hover:text-primary/80" : "hover:text-foreground")}
                    >
                        {isPrivate ? <HugeiconsIcon icon={Lock} size={16} /> : <HugeiconsIcon icon={LockOpen} size={16} />}
                        <span className="text-xs font-medium">{isPrivate ? '私密' : '公开'}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onTogglePinned}
                        className={cn("h-8 px-2 gap-1.5 active:scale-95 transition-all text-muted-foreground", isPinned ? "text-primary bg-primary/5 hover:text-primary/80" : "hover:text-foreground")}
                    >
                        <HugeiconsIcon icon={Pin} size={16} className={cn(isPinned && "fill-current")} />
                        <span className="text-xs font-medium">置顶</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShowLocationPicker}
                        className="h-8 px-2 gap-1.5 text-muted-foreground active:scale-95 transition-all hover:text-foreground"
                        aria-label="添加定位"
                    >
                        <HugeiconsIcon icon={Location04Icon} size={16} />
                        <span className="text-xs font-medium">定位</span>
                    </Button>

                    {isFullscreenAvailable && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onShowFullscreen}
                            className="h-8 px-2 gap-1.5 text-muted-foreground active:scale-95 transition-all hover:text-foreground"
                            aria-label="放大"
                        >
                            <HugeiconsIcon icon={Maximize2} size={16} />
                            <span className="text-xs font-medium">放大</span>
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {content.trim().length > 0 && (
                        <span className="text-[10px] text-muted-foreground/40 tabular-nums ml-1">
                            {content.trim().length} 字
                        </span>
                    )}
                    <div className="flex items-center gap-2">
                        {(mode === 'edit' || content.trim()) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCancel}
                                className="h-8 px-3 text-muted-foreground hover:text-foreground transition-all active:scale-95"
                            >
                                取消
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={onPublish}
                            disabled={!content.trim() || isPending}
                            className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all active:scale-95"
                        >
                            {isPending ? '提交中...' : mode === 'edit' ? '保存' : '发布'}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
