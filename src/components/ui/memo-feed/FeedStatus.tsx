'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon as Loader2 } from "@hugeicons/core-free-icons";
import { MemoCardSkeleton } from "../MemoCardSkeleton";

interface FeedStatusProps {
    isLoadingOlder: boolean;
    hasMoreOlder: boolean;
    memosCount: number;
}

export function FeedStatus({ isLoadingOlder, hasMoreOlder, memosCount }: FeedStatusProps) {
    if (isLoadingOlder) {
        return (
            <div className="py-4 flex items-center justify-center min-h-[60px]">
                <div className="flex items-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="flex items-center justify-center"
                    >
                        <HugeiconsIcon
                            icon={Loader2}
                            size={24}
                            className="text-muted-foreground/50 transform-gpu will-change-transform"
                        />
                    </motion.div>
                    <span className="ml-2 text-xs text-muted-foreground/60">加载更多...</span>
                </div>
            </div>
        );
    }

    if (!hasMoreOlder && memosCount > 0) {
        return (
            <div className="py-8 text-center text-xs text-muted-foreground/40 font-mono tracking-widest uppercase">
                --- The End ---
            </div>
        );
    }

    if (memosCount === 0) {
        return (
            <div className="w-full">
                <MemoCardSkeleton isEmpty={true} />
            </div>
        );
    }

    return <div className="h-[60px]" />; // Spacer
}
