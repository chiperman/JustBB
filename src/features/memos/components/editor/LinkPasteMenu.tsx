'use client';

import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHasMounted } from '@/hooks/useHasMounted';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Link01Icon,
    Bookmark01Icon,
    UserIcon,
} from '@hugeicons/core-free-icons';

export type LinkRenderMode = 'mention' | 'pill' | 'card';

interface LinkPasteMenuProps {
    position: { top: number; left: number } | null;
    onSelect: (mode: LinkRenderMode) => void;
    onClose: () => void;
}

export function LinkPasteMenu({
    position,
    onSelect,
    onClose
}: LinkPasteMenuProps) {
    const hasMounted = useHasMounted();
    const [selectedIndex, setSelectedIndex] = useState(0);

    const options: { mode: LinkRenderMode; label: string; icon: React.FC<any> }[] = [
        { mode: 'mention', label: '提及', icon: UserIcon },
        { mode: 'pill', label: 'URL', icon: Link01Icon },
        { mode: 'card', label: '书签', icon: Bookmark01Icon },
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!position) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % options.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + options.length - 1) % options.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onSelect(options[selectedIndex].mode);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [position, selectedIndex, onSelect, onClose]);

    // 当 position 发生变化时，重置 selectedIndex 为 0。
    // 使用 useLayoutEffect 确保在渲染前同步更新，避免视觉闪烁
    useLayoutEffect(() => {
        if (position) {
            setSelectedIndex(0);
        }
    }, [position]);

    if (!hasMounted || !position) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="fixed z-[10001] w-[180px] pointer-events-auto"
                style={{
                    top: position.top,
                    left: position.left,
                }}
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <div className="bg-popover backdrop-blur-xl border border-border/40 rounded-md shadow-2xl overflow-hidden flex flex-col py-1">
                    <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium border-b border-border/40 mb-1">
                        粘贴为
                    </div>
                    {options.map((opt, index) => (
                        <button
                            key={opt.mode}
                            onClick={() => onSelect(opt.mode)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 transition-colors outline-none w-full text-left relative",
                                index === selectedIndex
                                    ? "bg-accent text-accent-foreground"
                                    : "text-foreground/80 hover:bg-accent/50"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center w-5 h-5 rounded transition-colors",
                                index === selectedIndex ? "text-primary bg-primary/10" : "text-muted-foreground/60"
                            )}>
                                <HugeiconsIcon icon={opt.icon} size={16} />
                            </div>
                            <span className="text-xs font-medium tracking-tight">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
