'use client';

import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
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
            initial={{ opacity: 0, y: 20, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ 
                delay: index * 0.05, 
                duration: 0.8,
                ease: [0.23, 1, 0.32, 1] 
            }}
            className="group relative"
        >
            <div className="absolute -left-16 top-10 text-[8px] text-muted-foreground/30 rotate-[-90deg] hidden lg:block font-mono tracking-[0.4em] pointer-events-none select-none uppercase transition-colors group-hover:text-primary/40">
                Archive Ref: {memo.id.slice(0, 8)}
            </div>
            <div className="absolute -right-12 top-10 text-[8px] text-destructive/20 rotate-[90deg] hidden lg:block font-mono tracking-[0.4em] pointer-events-none select-none uppercase group-hover:text-destructive/40 transition-colors">
                Abandoned
            </div>
            
            <div className={cn(
                "transition-all duration-700 ease-out rounded-card",
                "filter grayscale-[0.3] sepia-[0.2] blur-[0.5px] brightness-[0.95]",
                "hover:filter-none hover:brightness-100 hover:shadow-xl hover:shadow-primary/5",
                "border border-transparent hover:border-border/40"
            )}>
                <MemoCard memo={memo} />
            </div>
        </motion.div>
    );
}
