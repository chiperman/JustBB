'use client';

import { memo } from "react";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useReducedMotion } from 'framer-motion';
import { Memo } from '@/types/memo';
import { MemoEditor } from './MemoEditor';
import { MemoCardView } from './memo-card/MemoCardView';

interface MemoCardProps {
    memo: Memo;
    isAdmin?: boolean;
    isEditing?: boolean;
    onEditChange?: (editing: boolean, updatedMemo?: Memo) => void;
    showOriginalOnly?: boolean;
}

export const MemoCard = memo(function MemoCard({ 
    memo, 
    isAdmin = false, 
    isEditing, 
    onEditChange, 
    showOriginalOnly = false 
}: MemoCardProps) {
    const shouldReduceMotion = useReducedMotion();
    const hasMounted = useHasMounted();

    if (isEditing) {
        return (
            <article className="bg-card border border-border rounded-card p-6 relative z-20">
                <MemoEditor
                    mode="edit"
                    memo={memo}
                    onCancel={() => onEditChange?.(false)}
                    onSuccess={(updatedMemo) => onEditChange?.(false, updatedMemo)}
                />
            </article>
        );
    }

    return (
        <MemoCardView 
            memo={memo}
            isAdmin={isAdmin}
            showOriginalOnly={showOriginalOnly}
            onEdit={() => onEditChange?.(true)}
            shouldReduceMotion={!!shouldReduceMotion}
            hasMounted={hasMounted}
        />
    );
});
