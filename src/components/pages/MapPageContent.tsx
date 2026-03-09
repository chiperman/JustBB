'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMapMemos } from '@/hooks/useMapMemos';
import { MapLoadingScreen } from './map/MapLoadingScreen';
import { MapErrorScreen } from './map/MapErrorScreen';

export function MapPageContent() {
    const { markers, isLoading, MapView } = useMapMemos();

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
                            <MapLoadingScreen />
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
                            <MapErrorScreen />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
