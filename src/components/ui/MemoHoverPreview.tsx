'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading01Icon as Loader2 } from '@hugeicons/core-free-icons';

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
            'z-50 w-72 rounded-2xl border bg-popover/95 backdrop-blur-md p-5 text-popover-foreground shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { getMemoByNumber } = (await import('@/actions/preview')) as any;
                const memo = await getMemoByNumber(parseInt(memoNumber));
                if (memo) {
                    setPreviewContent(memo.content);
                } else {
                    setPreviewContent('Memo not found.');
                }
            } catch {
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
                <div className="space-y-3">
                    <div className="text-[10px] text-primary/60 font-mono font-bold uppercase tracking-wider tabular-nums">#{memoNumber}</div>
                    <div className="text-sm">
                        {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <HugeiconsIcon icon={Loader2} size={12} className="animate-spin text-primary" />
                                <span className="text-xs font-medium animate-pulse">Loading…</span>
                            </div>
                        ) : (
                            <p className="line-clamp-6 leading-relaxed text-[13px] text-foreground/90 text-pretty">
                                {previewContent || 'Preview not available'}
                            </p>
                        )}
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
