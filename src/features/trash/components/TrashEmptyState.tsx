'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon as Sparkles } from '@hugeicons/core-free-icons';

export function TrashEmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-border/20 bg-muted/5 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
            
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-16 h-16 flex items-center justify-center rounded-full border border-primary/5 bg-background/40 backdrop-blur-sm">
                    <HugeiconsIcon icon={Sparkles} size={32} className="text-primary/20" />
                </div>
            </div>
            
            <p className="italic text-muted-foreground/40 text-sm font-sans tracking-widest text-center px-10">
                尘埃落定 &mdash; 这里没有任何被遗忘的片段。
            </p>
            
            <div className="mt-8 flex gap-1">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-primary/10" />
                ))}
            </div>
        </motion.div>
    );
}
