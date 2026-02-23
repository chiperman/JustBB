'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Location } from '@/types/memo';

// Leaflet CSS 需要在客户端动态导入
// 使用 dynamic import 避免 SSR 问题
let leafletLoaded = false;

interface MapViewProps {
    /** 标记点列表 */
    markers: (Location & { memoId?: string; memoNumber?: number })[];
    /** mini: 悬浮预览小地图 (200x150), full: 全页地图 */
    mode?: 'mini' | 'full';
    /** 自定义 className */
    className?: string;
    /** 点击标记点回调 */
    onMarkerClick?: (marker: Location & { memoId?: string; memoNumber?: number }) => void;
    /** 地图点击回调（用于选点） */
    onMapClick?: (lat: number, lng: number) => void;
    /** 标记拖拽结束回调 */
    onMarkerDragEnd?: (lat: number, lng: number) => void;
}

export function MapView({ markers, mode = 'mini', className, onMarkerClick, onMapClick, onMarkerDragEnd }: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        let cancelled = false;

        const updateOrInitMap = async () => {
            const L = (await import('leaflet')).default;

            if (!leafletLoaded) {
                // @ts-ignore
                await import('leaflet/dist/leaflet.css');
                leafletLoaded = true;
            }

            if (cancelled || !mapRef.current) return;

            // 如果地图尚未初始化，执行初始化
            if (!mapInstanceRef.current) {
                const center = markers.length > 0
                    ? [markers[0].lat, markers[0].lng] as [number, number]
                    : [35.6762, 139.6503] as [number, number];

                const zoom = mode === 'mini' ? 13 : (markers.length > 1 ? 5 : 13);

                const map = L.map(mapRef.current, {
                    center,
                    zoom,
                    zoomControl: mode === 'full',
                    attributionControl: mode === 'full',
                    dragging: mode !== 'mini',
                    scrollWheelZoom: true,
                    doubleClickZoom: mode !== 'mini',
                    touchZoom: mode !== 'mini',
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: mode === 'full' ? '&copy; OpenStreetMap' : '',
                    maxZoom: 19,
                }).addTo(map);

                if (onMapClick) {
                    map.on('click', (e: L.LeafletMouseEvent) => {
                        onMapClick(e.latlng.lat, e.latlng.lng);
                    });
                }

                mapInstanceRef.current = map;
            }

            const map = mapInstanceRef.current;

            // 清除旧标记
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            // 自定义标记图标
            const markerIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div style="width: 24px; height: 24px; background: var(--color-primary, #d97757); border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            // 添加新标记
            markers.forEach(marker => {
                const m = L.marker([marker.lat, marker.lng], {
                    icon: markerIcon,
                    draggable: false // 禁止拖拽标记
                }).addTo(map);

                if (mode === 'full' && marker.name) {
                    m.bindPopup(`<strong>${marker.name}</strong>`);
                } else if (mode === 'mini' && marker.name) {
                    m.bindTooltip(marker.name, { permanent: true, direction: 'top', offset: [0, -14], className: 'map-tooltip-mini' });
                }

                if (onMarkerClick) {
                    m.on('click', () => onMarkerClick(marker));
                }
            });

            // 如果只有一个标记且地图不在中心，则移动到中心（例如搜索结果）
            if (markers.length === 1 && !cancelled) {
                map.setView([markers[0].lat, markers[0].lng], map.getZoom(), { animate: true });
            } else if (mode === 'full' && markers.length > 1) {
                const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        };

        updateOrInitMap();

        return () => {
            cancelled = true;
        };
    }, [markers, mode, onMarkerClick, onMapClick, onMarkerDragEnd]);

    // 独立清理 Effect
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const sizeClasses = mode === 'mini'
        ? 'w-[220px] h-[150px]'
        : 'w-full h-full min-h-[500px]';

    return (
        <div
            ref={mapRef}
            className={cn(
                'rounded-inner overflow-hidden',
                sizeClasses,
                // 应用极简主义滤镜：降低饱和度，增加对比度
                'grayscale-[0.9] brightness-[1.05] contrast-[1.1] hover:grayscale-0 transition-all duration-500',
                className
            )}
            style={{ zIndex: 0 }}
        />
    );
}
