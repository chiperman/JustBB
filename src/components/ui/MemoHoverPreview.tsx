'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '@/lib/utils';
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
                <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-mono">#{memoNumber}</div>
                    <div className="text-sm">
                        {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
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
