'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location04Icon } from '@hugeicons/core-free-icons';

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
            'z-50 rounded-2xl border bg-popover/95 backdrop-blur-md p-3 text-popover-foreground shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
        )}
        {...props}
    />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

interface LocationHoverPreviewProps {
    name: string;
    lat: number;
    lng: number;
    children: React.ReactNode;
}

export function LocationHoverPreview({ name, lat, lng, children }: LocationHoverPreviewProps) {
    const [MapView, setMapView] = React.useState<React.ComponentType<{
        markers: { name: string; lat: number; lng: number }[];
        mode: 'mini' | 'full';
    }> | null>(null);

    const handleOpenChange = React.useCallback(async (open: boolean) => {
        if (open && !MapView) {
            // 懒加载 MapView 组件
            const mod = await import('./MapView');
            setMapView(() => mod.MapView);
        }
    }, [MapView]);

    return (
        <HoverCard onOpenChange={handleOpenChange} openDelay={300} closeDelay={100}>
            <HoverCardTrigger asChild>
                {children}
            </HoverCardTrigger>
            <HoverCardContent>
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={Location04Icon} size={12} className="text-primary" />
                        <span className="text-[12px] font-medium text-foreground/80">{name}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        {lat.toFixed(4)}, {lng.toFixed(4)}
                    </div>
                    <div className="rounded-inner overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                        {MapView ? (
                            <MapView
                                markers={[{ name: '', lat, lng }]}
                                mode="mini"
                            />
                        ) : (
                            <div className="w-[220px] h-[150px] bg-muted/20 animate-pulse flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">加载地图…</span>
                            </div>
                        )}
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
}
