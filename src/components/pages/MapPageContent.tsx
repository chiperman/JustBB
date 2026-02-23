'use client';

import { useEffect, useState } from 'react';
import { getMemosWithLocations } from '@/actions/locations';
import type { Memo, Location } from '@/types/memo';
import { Location04Icon, Loading03Icon as LoadingIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { locationCache, type MapMarker } from '@/lib/location-cache';

// 模块级预加载：JS chunk 解析时即开始下载 MapView，不等 useEffect
const mapViewPromise = import('@/components/ui/MapView');

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
        let isMounted = true;

        const load = async () => {
            // 如果缓存中已有数据，先同步到前端展示，但保留 isLoading 为 true 以播放优雅过渡动画
            if (locationCache.getInitialized()) {
                setMarkers(locationCache.getMarkers());
            }

            // 设定一个最小动画延时 (600ms)，让哪怕命中缓存，也能看到优雅的过渡效果，而不是生硬闪显
            const minAnimTime = new Promise(resolve => setTimeout(resolve, 600));

            // 并行请求新数据和动态组件
            const fetchPromise = Promise.all([
                getMemosWithLocations(),
                mapViewPromise,
            ]);

            // 等待至少 600ms 或者 数据读取完成（取决于哪个更慢，通常缓存秒回则卡 600ms）
            const [[result, mapModule]] = await Promise.all([fetchPromise, minAnimTime]);

            if (!isMounted) return;

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

                // 覆盖缓存对象
                locationCache.setMarkers(allMarkers);
                setMarkers(allMarkers);
            }

            // 数据准备完毕并且最小动画时间已过，结束骨架屏
            setIsLoading(false);
        };

        load();

        return () => { isMounted = false; };
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
                        <div className="w-full h-full min-h-[500px] bg-muted/20 relative flex items-center justify-center overflow-hidden">
                            {/* 底层网格与径向渐变，制造空间纵深感 */}
                            <div className="absolute inset-0 z-0
                                [background-image:radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background))_70%),linear-gradient(to_right,hsl(var(--muted-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground))_1px,transparent_1px)]
                                [background-size:100%_100%,20px_20px,20px_20px]
                                opacity-[0.08]"
                            />

                            {/* 中心发光与脉冲涟漪 */}
                            <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                                <div className="relative flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping duration-[3000ms]" />
                                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                                    <div className="relative bg-background/50 border border-primary/20 backdrop-blur-sm p-4 rounded-full text-primary shadow-lg flex items-center justify-center">
                                        <HugeiconsIcon icon={Location04Icon} size={32} className="animate-pulse" />
                                    </div>
                                </div>

                                {/* 毛玻璃徽章文本 */}
                                <div className="px-4 py-2 bg-background/40 backdrop-blur-md border border-border/50 rounded-full shadow-sm">
                                    <span className="text-[13px] font-medium text-foreground/70 tracking-wide flex items-center gap-2">
                                        <HugeiconsIcon icon={LoadingIcon} size={14} className="animate-spin text-muted-foreground" />
                                        正在连接空间信标...
                                    </span>
                                </div>
                            </div>
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
