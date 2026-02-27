'use client';

import { useEffect, useState } from 'react';
import { getMemosWithLocations } from '@/actions/locations';
import { Location04Icon, Cancel01Icon as CloseIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { locationCache, type MapMarker } from '@/lib/location-cache';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// 模块级预加载：JS chunk 解析时即开始下载 MapView，不等 useEffect
const mapViewPromise = import('@/components/ui/MapView');

export function MapPageContent() {
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [isLoading, setIsLoading] = useState(!locationCache.getInitialized());
    const [MapView, setMapView] = useState<React.ComponentType<{
        markers: MapMarker[];
        mode: 'mini' | 'full';
        className?: string;
        onMarkerClick?: (marker: MapMarker) => void;
        onMapClick?: () => void;
    }> | null>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const hasCache = locationCache.getInitialized();

            // 如果缓存中已有数据，先同步到前端展示
            if (hasCache) {
                setMarkers(locationCache.getMarkers());
            }

            // 并行任务规划
            // 首次进入：等待数据 + 地图组件 + 1.5s 仪式感延迟
            // 再次进入：仅等待地图组件（通常已加载），数据在后台静默执行
            const minTime = hasCache ? 0 : 1500;

            const [result, mapModule] = await Promise.all([
                getMemosWithLocations(),
                mapViewPromise,
                new Promise(resolve => setTimeout(resolve, minTime))
            ]);

            if (!isMounted) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setMapView(() => mapModule.MapView as any);

            if (result.success && isMounted) {
                // 按坐标 [lat, lng] 聚合同一地点的多个记录
                const groupedMap = new Map<string, MapMarker>();

                result.data.forEach(memo => {
                    memo.locations.forEach(loc => {
                        const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;

                        if (groupedMap.has(key)) {
                            const marker = groupedMap.get(key)!;
                            marker.items.push(memo);
                        } else {
                            groupedMap.set(key, {
                                ...loc,
                                items: [memo]
                            });
                        }
                    });
                });

                const allMarkers = Array.from(groupedMap.values());

                // 覆盖缓存对象并更新视图
                locationCache.setMarkers(allMarkers);
                setMarkers(allMarkers);
            }

            // 数据拉取及最小感知时长均完成后，结束 loading
            if (isMounted) {
                // 判断获取到的 mapModule 中是否具备有效的 MapView 组件
                if (mapModule && typeof mapModule.MapView !== 'undefined') {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            isMounted = false;
            // 确保组件卸载时重置状态，防止切回时状态混乱
            setIsLoading(true);
        };
    }, []);

    return (
        <div className="flex flex-col gap-4 h-full min-h-0">
            <div className="px-6 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <h1 className="text-base font-semibold text-foreground">地图</h1>
                </div>
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    {markers.length} 个定位点
                </span>
            </div>

            <div className="flex-1 min-h-0 px-6 pb-6 relative">
                <div className="w-full h-full rounded-inner overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-sm relative bg-card">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
                                className="absolute inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
                            >
                                {/* 背景网格与动态扫描线 */}
                                <div className="absolute inset-0 z-0">
                                    <div className="absolute inset-0
                                        [background-image:radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background))_70%),linear-gradient(to_right,hsl(var(--muted-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground))_1px,transparent_1px)]
                                        [background-size:100%_100%,40px_40px,40px_40px]
                                        opacity-[0.05]"
                                    />
                                    {/* 垂直扫描光束 */}
                                    <motion.div
                                        initial={{ translateY: '-100%' }}
                                        animate={{ translateY: '200%' }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-x-0 h-[30vh] bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-2xl pointer-events-none"
                                    />
                                </div>

                                <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                                    <div className="relative flex items-center justify-center">
                                        {/* 多层雷达脉冲 */}
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{
                                                    scale: [0.8, 1.2, 3],
                                                    opacity: [0, 0.6, 0]
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    delay: i * 1,
                                                    times: [0, 0.2, 1],
                                                    ease: "linear"
                                                }}
                                                className="absolute inset-0 rounded-full border-2 border-primary/30"
                                            />
                                        ))}

                                        <div className="relative bg-background border border-primary/30 backdrop-blur-md p-6 rounded-full text-primary shadow-2xl flex items-center justify-center">
                                            <HugeiconsIcon icon={Location04Icon} size={40} className="animate-pulse" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <div className="px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
                                            <span className="text-[12px] font-medium text-primary/80 tracking-widest uppercase flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                </span>
                                                Scanning Environment
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground/60 font-medium animate-pulse">
                                            正在同步空间信标数据...
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : MapView ? (
                            <motion.div
                                key="map"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="w-full h-full"
                            >
                                <MapView
                                    markers={markers}
                                    mode="full"
                                    className="w-full h-full min-h-[500px]"
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full h-full flex items-center justify-center bg-muted/5"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-destructive/10 rounded-full text-destructive">
                                        <HugeiconsIcon icon={CloseIcon} size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">空间导航系统连接失败</span>
                                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
                                        重新尝试
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
