'use client';

import { useEffect, useState } from 'react';
import { getMemosWithLocations } from '@/actions/locations';
import { Location04Icon, Loading03Icon as LoadingIcon, Cancel01Icon as CloseIcon, LinkSquare02Icon as LinkIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { locationCache, type MapMarker } from '@/lib/location-cache';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// 模块级预加载：JS chunk 解析时即开始下载 MapView，不等 useEffect
const mapViewPromise = import('@/components/ui/MapView');

export function MapPageContent() {
    const router = useRouter();
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
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
            // 如果缓存中已有数据，先同步到前端展示，并尽快结束 isLoading
            if (locationCache.getInitialized()) {
                setMarkers(locationCache.getMarkers());
                // 但是要确保 MapView 组件本身已经动态引入完成再结束 loading
                mapViewPromise.then(mapModule => {
                    if (isMounted) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setMapView(() => mapModule.MapView as any);
                        setIsLoading(false);
                    }
                });
            }

            // 并行请求新数据和动态组件（后台静默 SWR 拉取）
            const [result, mapModule] = await Promise.all([
                getMemosWithLocations(),
                mapViewPromise,
            ]);

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

                // 覆盖缓存对象并更新视图
                locationCache.setMarkers(allMarkers);
                setMarkers(allMarkers);
            }

            // 无论是否之前被缓存命中中断过 isLoading，这里都确实数据请求完毕了
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
                            onMarkerClick={(marker) => setSelectedMarker(marker)}
                            onMapClick={() => setSelectedMarker(null)}
                        />
                    ) : (
                        <div className="w-full h-full min-h-[500px] bg-muted/20 flex items-center justify-center">
                            <span className="text-sm text-muted-foreground">地图加载失败</span>
                        </div>
                    )}

                    {/* 气泡悬浮预览框 */}
                    <AnimatePresence>
                        {selectedMarker && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-80 max-w-[calc(100vw-3rem)] pointer-events-auto"
                            >
                                <div className="bg-background/90 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                                    {/* 顶部：关闭按钮与地名 */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 text-primary font-medium text-sm flex-1 min-w-0">
                                            <HugeiconsIcon icon={Location04Icon} size={16} className="shrink-0" />
                                            <span className="truncate">{selectedMarker.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedMarker(null)}
                                            className="h-6 w-6 rounded-full shrink-0 text-muted-foreground hover:bg-muted/50 transition-colors"
                                        >
                                            <HugeiconsIcon icon={CloseIcon} size={14} />
                                        </Button>
                                    </div>

                                    {/* 中间：Memo 正文截断 */}
                                    <p className="text-[13px] leading-relaxed text-foreground/80 line-clamp-3 text-pretty">
                                        {selectedMarker.content.replace(/📍\[.*?\]\([^)]+\)/g, '') || '获取正文内容异常'}
                                    </p>

                                    {/* 底部：来源标记 & 导航 */}
                                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                                        <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/50 px-2 py-[2px] rounded-md">
                                            #{selectedMarker.memoNumber}
                                        </span>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => router.push(`/?q=${selectedMarker.memoNumber}`)}
                                            className="h-7 text-xs px-3 rounded-full font-medium gap-1.5 shadow-sm hover:shadow active:scale-95 transition-all"
                                        >
                                            查看原文
                                            <HugeiconsIcon icon={LinkIcon} size={12} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
