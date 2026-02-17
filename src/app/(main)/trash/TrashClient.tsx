'use client';

import { getTrashMemos } from "@/actions/fetchTrash";
import { emptyTrash } from "@/actions/delete";
import { MemoCard } from "@/components/ui/MemoCard";
import { Trash2, Archive, Loader2, Sparkles } from "lucide-react";
import { Memo } from "@/types/memo";
import { useEffect, useState, useTransition } from "react";

import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TrashClient() {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            const data = await getTrashMemos();
            if (isMounted) {
                setMemos(data || []);
                setIsLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, []);


    const handleEmptyTrash = () => {
        startTransition(async () => {
            const result = await emptyTrash();
            if (result.success) {
                toast({
                    title: "回收站已清空",
                    description: "所有记录已永久删除",
                    variant: "destructive",
                });
                setMemos([]);
            } else {
                toast({
                    title: "操作失败",
                    description: result.error,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-md mx-auto space-y-12">
                    <section>
                        <header className="mb-10 flex items-end justify-between border-b border-border/20 pb-8">
                            <div className="space-y-3">
                                <h2 className="text-3xl font-serif font-bold tracking-tight italic flex items-center gap-3">
                                    <Archive className="w-8 h-8 text-muted-foreground/40" /> 回收站
                                </h2>
                                <p className="text-muted-foreground text-sm font-sans tracking-wide opacity-70 italic">
                                    Fragments intended for oblivion. {"\n"}
                                    被遗忘的片段，在这里等待最后的归宿。
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                                    Total: {memos.length.toString().padStart(2, '0')}
                                </div>
                                {memos.length > 0 && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all text-[10px] uppercase font-mono tracking-widest gap-2 rounded-sm h-7"
                                                disabled={isPending}
                                            >
                                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                                Empty Trash
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>清空回收站？</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    此操作将永久删除回收站内的所有记录。该操作不可逆，请谨慎操作。
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-sm">取消</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleEmptyTrash}
                                                    className="bg-destructive hover:bg-destructive/90 rounded-sm"
                                                >
                                                    确认清空
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </header>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/40" />
                                <span className="text-xs text-muted-foreground/60 font-mono uppercase tracking-widest">Retrieving archive...</span>
                            </div>
                        ) : memos.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-24 bg-muted/5 rounded-sm border border-dashed border-border/30"
                            >
                                <Sparkles className="w-8 h-8 text-muted-foreground/20 mb-4" />
                                <p className="font-serif italic text-muted-foreground opacity-40">尘埃落定，这里空无一物。</p>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                <AnimatePresence mode="popLayout">
                                    {memos.map((memo: Memo, idx) => (
                                        <motion.div
                                            key={memo.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                            transition={{ delay: idx * 0.03, duration: 0.4 }}
                                            className="group relative"
                                        >
                                            <div className="absolute -left-12 top-10 text-[9px] text-destructive/40 rotate-[-90deg] hidden lg:block font-mono tracking-widest pointer-events-none select-none">
                                                ABANDONED
                                            </div>
                                            <div className={cn(
                                                "transition-all duration-500 rounded-sm overflow-hidden",
                                                "opacity-60 grayscale-[0.4] hover:opacity-100 hover:grayscale-0",
                                                "border-dashed"
                                            )}>
                                                <MemoCard memo={memo} />
                                            </div>
                                        </motion.div>
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
