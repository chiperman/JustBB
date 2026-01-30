import { getTrashMemos } from "@/actions/fetchTrash";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { MemoCard } from "@/components/ui/MemoCard";
import { Trash2 } from "lucide-react";

export default async function TrashPage() {
    const memos = (await getTrashMemos()) || [];

    return (
        <div className="flex min-h-screen justify-center selection:bg-primary/20 bg-background/50">
            <div className="flex w-full max-w-(--breakpoint-2xl)">
                <LeftSidebar />

                <main className="flex-1 min-w-0 bg-background px-4 md:px-8 py-10">
                    <div className="max-w-2xl mx-auto space-y-10">
                        <header className="flex items-center gap-2 text-destructive pb-4 border-b border-border">
                            <Trash2 className="w-6 h-6" />
                            <h2 className="text-2xl font-bold tracking-tight">垃圾箱</h2>
                            <span className="ml-auto text-sm text-muted-foreground">
                                共 {memos.length} 条已删除记录
                            </span>
                        </header>

                        <div className="space-y-8">
                            {memos.length === 0 ? (
                                <div className="text-center py-20 text-muted-foreground">
                                    垃圾箱空空如也 🍃
                                </div>
                            ) : (
                                memos.map((memo: any) => (
                                    <div key={memo.id} className="opacity-75 hover:opacity-100 transition-opacity relative group">
                                        <div className="absolute -left-8 top-6 text-xs text-destructive rotate-[-90deg] hidden lg:block font-mono opacity-50">DELETED</div>
                                        <MemoCard memo={memo} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>

                <RightSidebar />
            </div>
        </div>
    );
}
