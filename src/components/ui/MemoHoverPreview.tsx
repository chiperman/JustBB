'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '@/lib/utils';
import { getMemos } from '@/actions/fetchMemos';
import { Loader2 } from 'lucide-react';

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;
const HoverCardContent = React.forwardRef<
    React.ElementRef<typeof HoverCardPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <HoverCardPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
            'z-50 w-64 rounded-xl border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
        )}
        {...props}
    />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

interface MemoHoverPreviewProps {
    memoId: string; // logic handles converting #123 to ID? No, we search by #number
    memoNumber: string;
    children: React.ReactNode;
}

export function MemoHoverPreview({ memoNumber, children }: MemoHoverPreviewProps) {
    const [previewContent, setPreviewContent] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const handleOpenOption = async (open: boolean) => {
        if (open && !previewContent) {
            setLoading(true);
            try {
                // We use search by query "#123"? Or logic?
                // `getMemos` with query might be fuzzy. 
                // Ideally we need `getMemoByNumber`.
                // Let's assume we can fetch by query for now or add a specific action.
                // Re-using fetch logic: query "@memoNumber" might NOT find the memo itself, it finds memos REFERENCING it.
                // We want to find the memo WITH that number.
                // So query should be... we don't have a direct "get by number" RPC exposed in fetchMemos easily without changing it.
                // But wait, search_memos_secure uses `query_text`. 
                // Does it search memo_number? Probably not unless we check SQL.
                // Let's creating a specific server action for this to be safe and efficient.
                const { getMemoByNumber } = await import('@/actions/preview');
                const memo = await getMemoByNumber(parseInt(memoNumber));
                if (memo) {
                    setPreviewContent(memo.content);
                } else {
                    setPreviewContent('Memo not found.');
                }
            } catch (e) {
                setPreviewContent('Error loading preview.');
            }
            setLoading(false);
        }
    };

    return (
        <HoverCard onOpenChange={handleOpenOption}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent>
                <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-mono">#{memoNumber}</div>
                    <div className="text-sm">
                        {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Loading...
                            </div>
                        ) : (
                            <p className="line-clamp-4 leading-relaxed text-xs">
                                {previewContent || 'Preview not available'}
                            </p>
                        )}
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
