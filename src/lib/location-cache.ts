import { Location } from '@/types/memo';
import type { Memo } from '@/types/memo';

export interface MapMarker extends Location {
    items: Memo[];
    // 以下字段保持可选以兼容旧逻辑，但逻辑上应该优先使用 items
    memoId?: string;
    memoNumber?: number;
    content?: string;
}

class LocationCache {
    private static instance: LocationCache;
    private markers: MapMarker[] = [];
    private isInitialized = false;

    private constructor() { }

    public static getInstance(): LocationCache {
        if (!LocationCache.instance) {
            LocationCache.instance = new LocationCache();
        }
        return LocationCache.instance;
    }

    public getInitialized(): boolean {
        return this.isInitialized;
    }

    public setMarkers(items: MapMarker[]) {
        this.markers = items;
        this.isInitialized = true;
    }

    public getMarkers(): MapMarker[] {
        return this.markers;
    }
}

export const locationCache = LocationCache.getInstance();
