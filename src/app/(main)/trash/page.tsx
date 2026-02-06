import { getTrashMemos } from "@/actions/fetchTrash";
import { MemoCard } from "@/components/ui/MemoCard";
import { Trash2 } from "lucide-react";
import { Memo } from "@/types/memo";

export default async function TrashPage() {
    const memos = (await getTrashMemos()) || [];

    return (
        <div className="space-y-10">
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
                    memos.map((memo: Memo) => (
                        <div key={memo.id} className="opacity-75 hover:opacity-100 transition-opacity relative group">
                            <div className="absolute -left-8 top-6 text-xs text-destructive rotate-[-90deg] hidden lg:block font-mono opacity-50">DELETED</div>
                            <MemoCard memo={memo} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
