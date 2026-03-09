'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Memo } from '@/types/memo';

interface MemoCardBacklinksProps {
    memoId: string;
    showBacklinks: boolean;
    isLoading: boolean;
    backlinks: Memo[];
}

export function MemoCardBacklinks({
    memoId,
    showBacklinks,
    isLoading,
    backlinks,
}: MemoCardBacklinksProps) {
    return (
        <AnimatePresence>
            {showBacklinks && (
                <motion.div
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                        height: { duration: 0.35, ease: [0.33, 1, 0.68, 1] },
                        opacity: { duration: 0.2 }
                    }}
                    className="overflow-hidden"
                    id={`backlinks-${memoId}`}
                    role="region"
                    aria-label="反向引用列表"
                >
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-primary/30 rounded-full" />
                            Refered by:
                        </p>
                        <div className="min-h-[40px] relative">
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-xs text-muted-foreground animate-pulse"
                                    >
                                        Loading references...
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="space-y-2"
                                    >
                                        {backlinks.length > 0 ? (
                                            backlinks.map(link => (
                                                <div key={link.id} className="text-xs bg-muted/30 p-2 rounded-md flex justify-between items-center group/link hover:bg-accent transition-colors">
                                                    <span className="text-muted-foreground truncate max-w-[200px]">{link.content.substring(0, 30)}...</span>
                                                    <a
                                                        href={`/?num=${link.memo_number}`}
                                                        className="text-primary font-mono font-medium hover:underline focus-visible:ring-1 focus-visible:ring-primary/40 rounded px-1"
                                                    >
                                                        #{link.memo_number}
                                                    </a>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-muted-foreground italic">No references found.</div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
