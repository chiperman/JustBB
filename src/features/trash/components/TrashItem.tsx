'use client';

import { motion } from 'framer-motion';
import { MemoCard } from "@/features/memos";
import { Memo } from "@/types/memo";

interface TrashItemProps {
    memo: Memo;
    index: number;
}

export function TrashItem({ memo, index }: TrashItemProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
                delay: index * 0.05, 
                duration: 0.5,
                ease: [0.23, 1, 0.32, 1] 
            }}
            className="group relative mb-6"
        >
             <div className="rounded-card shadow-sm border border-transparent transition-colors hover:border-border/40">
                 <MemoCard memo={memo} />
             </div>
        </motion.div>
    );
}
