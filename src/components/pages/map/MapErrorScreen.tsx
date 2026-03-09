'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon as CloseIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';

export function MapErrorScreen() {
    return (
        <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex items-center justify-center bg-muted/5"
        >
            <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                    <HugeiconsIcon icon={CloseIcon} size={24} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">空间导航系统连接失败</span>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
                    重新尝试
                </Button>
            </div>
        </motion.div>
    );
}
