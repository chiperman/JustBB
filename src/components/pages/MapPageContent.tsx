'use client';

import { useEffect, useState } from 'react';
import { getMemosWithLocations } from '@/actions/locations';
import type { Memo, Location } from '@/types/memo';

// 模块级预加载：JS chunk 解析时即开始下载 MapView，不等 useEffect
const mapViewPromise = import('@/components/ui/MapView');

interface MapMarker extends Location {
    memoId: string;
    memoNumber: number;
    content?: string;
}

export function MapPageContent() {
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [MapView, setMapView] = useState<React.ComponentType<{
        markers: MapMarker[];
        mode: 'mini' | 'full';
        className?: string;
        onMarkerClick?: (marker: MapMarker) => void;
    }> | null>(null);

    useEffect(() => {
        const load = async () => {
            // 并行加载数据和组件（MapView 模块已在解析时预触发）
            const [result, mapModule] = await Promise.all([
                getMemosWithLocations(),
                mapViewPromise,
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMapView(() => mapModule.MapView as any);

            if (result.success) {
                const allMarkers: MapMarker[] = [];
                result.data.forEach(memo => {
                    memo.locations.forEach(loc => {
                        allMarkers.push({
                            ...loc,
                            memoId: memo.id,
                            memoNumber: memo.memo_number,
                            content: memo.content.slice(0, 100),
                        });
                    });
                });
                setMarkers(allMarkers);
            }

            setIsLoading(false);
        };

        load();
    }, []);

    return (
        <div className="flex flex-col gap-4 h-full min-h-0">
            <div className="px-6 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <h1 className="text-base font-semibold text-foreground">地图</h1>
                </div>
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    {markers.length} 个定位
                </span>
            </div>

            <div className="flex-1 min-h-0 px-6 pb-6">
                <div className="w-full h-full rounded-inner overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                    {isLoading ? (
                        <div className="w-full h-full min-h-[500px] bg-muted/20 animate-pulse flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">加载地图中…</span>
                        </div>
                    ) : MapView ? (
                        <MapView
                            markers={markers}
                            mode="full"
                            className="w-full h-full min-h-[500px]"
                        />
                    ) : (
                        <div className="w-full h-full min-h-[500px] bg-muted/20 flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">地图加载失败</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
