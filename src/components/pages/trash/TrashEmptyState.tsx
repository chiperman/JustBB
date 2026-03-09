'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { SparklesIcon as Sparkles } from '@hugeicons/core-free-icons';

export function TrashEmptyState() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-sm border border-dashed border-border/30"
        >
            <HugeiconsIcon icon={Sparkles} size={32} className="text-muted-foreground/20 mb-4" />
            <p className="italic text-muted-foreground opacity-40">尘埃落定，这里空无一物。</p>
        </motion.div>
    );
}
