'use client';

import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { MemoCard } from "@/components/ui/MemoCard";
import { Memo } from "@/types/memo";

interface TrashItemProps {
    memo: Memo;
    index: number;
}

export function TrashItem({ memo, index }: TrashItemProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ delay: index * 0.03, duration: 0.4 }}
            className="group relative"
        >
            <div className="absolute -left-12 top-10 text-[9px] text-destructive/40 rotate-[-90deg] hidden lg:block font-mono tracking-widest pointer-events-none select-none">
                ABANDONED
            </div>
            <div className={cn(
                "transition-all duration-500 rounded-sm",
                "opacity-60 grayscale-[0.4] hover:opacity-100 hover:grayscale-0"
            )}>
                <MemoCard memo={memo} />
            </div>
        </motion.div>
    );
}
