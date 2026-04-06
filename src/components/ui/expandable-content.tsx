'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';

interface ExpandableContentProps {
    children: ReactNode;
    needsExpansion: boolean;
    collapsedHeight?: number;
}

export function ExpandableContent({ 
    children, 
    needsExpansion, 
    collapsedHeight = 160 
}: ExpandableContentProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    // 默认假定需要折叠，避免加载闪烁；ResizeObserver 会快速纠正它
    const [isActuallyExpandable, setIsActuallyExpandable] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!needsExpansion) {
            return;
        }

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // 判断实际内容高度：如果超出预设高度一定阈值（比如 40px），才真正判定为可折叠
                const scrollHeight = entry.target.scrollHeight;
                setIsActuallyExpandable(scrollHeight > collapsedHeight + 40);
            }
        });

        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [needsExpansion, collapsedHeight]);

    const finalExpandable = needsExpansion && isActuallyExpandable;

    // 如果字数或行数条件根本没达到，直接渲染原内容
    if (!needsExpansion) return <>{children}</>;

    return (
        <div className="relative group/expandable w-full">
            <motion.div 
                layout
                initial={false}
                // 如果实际不需要折叠（高度不够），就不限制高度
                animate={{ height: (isExpanded || !finalExpandable) ? 'auto' : collapsedHeight }}
                className="overflow-hidden relative will-change-auto"
                transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            >
                <div ref={contentRef}>
                    {children}
                </div>
                
                <AnimatePresence>
                    {!isExpanded && finalExpandable && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none z-10" 
                        />
                    )}
                </AnimatePresence>
            </motion.div>

            <AnimatePresence>
                {finalExpandable && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex justify-center relative z-20 transition-all duration-300 ${isExpanded ? 'mt-2 mb-1' : '-mt-3'}`}
                    >
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1 bg-muted/80 backdrop-blur text-muted-foreground text-[10px] font-medium rounded-full hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm border border-border/50"
                        >
                            {isExpanded ? '收起内容' : '展开内容'}
                            <HugeiconsIcon icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} size={12} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
