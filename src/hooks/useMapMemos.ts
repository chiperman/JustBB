'use client';

import { useState, useEffect, ComponentType } from 'react';
import { getMemosWithLocations } from '@/actions/memos/query';
import { locationCache, type MapMarker } from '@/lib/location-cache';

// 模块级预加载
const mapViewPromise = import('@/components/ui/MapView');

interface MapViewProps {
    markers: MapMarker[];
    mode: 'mini' | 'full';
    className?: string;
    onMarkerClick?: (marker: MapMarker) => void;
    onMapClick?: () => void;
}

export function useMapMemos() {
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [isLoading, setIsLoading] = useState(!locationCache.getInitialized());
    const [MapView, setMapView] = useState<ComponentType<MapViewProps> | null>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const hasCache = locationCache.getInitialized();
            if (hasCache) {
                setMarkers(locationCache.getMarkers());
            }

            const minTime = hasCache ? 0 : 1500;

            const [result, mapModule] = await Promise.all([
                getMemosWithLocations(),
                mapViewPromise,
                new Promise(resolve => setTimeout(resolve, minTime))
            ]);

            if (!isMounted) return;

            setMapView(() => mapModule.MapView);

            if (result.success && isMounted) {
                const groupedMap = new Map<string, MapMarker>();
                const data = result.data || [];

                data.forEach(memo => {
                    memo.locations.forEach(loc => {
                        const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
                        if (groupedMap.has(key)) {
                            groupedMap.get(key)!.items.push(memo);
                        } else {
                            groupedMap.set(key, { ...loc, items: [memo] });
                        }
                    });
                });

                const allMarkers = Array.from(groupedMap.values());
                locationCache.setMarkers(allMarkers);
                setMarkers(allMarkers);
            }

            if (isMounted && mapModule) {
                setIsLoading(false);
            }
        };

        load();

        return () => {
            isMounted = false;
            setIsLoading(true);
        };
    }, []);

    return { markers, isLoading, MapView };
}
