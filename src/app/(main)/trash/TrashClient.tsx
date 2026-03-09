'use client';

import { AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading01Icon as Loader2 } from '@hugeicons/core-free-icons';

import { useTrashMemos } from "@/hooks/useTrashMemos";
import { TrashHeader } from "@/components/pages/trash/TrashHeader";
import { TrashEmptyState } from "@/components/pages/trash/TrashEmptyState";
import { TrashItem } from "@/components/pages/trash/TrashItem";

export default function TrashClient() {
    const { memos, isLoading, isPending, handleEmptyTrash } = useTrashMemos();

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-md mx-auto space-y-12">
                    <section>
                        <TrashHeader 
                            count={memos.length} 
                            isPending={isPending} 
                            onEmptyTrash={handleEmptyTrash} 
                        />

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <HugeiconsIcon icon={Loader2} size={24} className="animate-spin text-muted-foreground/40" />
                                <span className="text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">
                                    Retrieving archive...
                                </span>
                            </div>
                        ) : memos.length === 0 ? (
                            <TrashEmptyState />
                        ) : (
                            <div className="space-y-6">
                                <AnimatePresence mode="popLayout">
                                    {memos.map((memo, idx) => (
                                        <TrashItem 
                                            key={memo.id} 
                                            memo={memo} 
                                            index={idx} 
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
