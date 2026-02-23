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
}

export function MapView({ markers, mode = 'mini', className, onMarkerClick }: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        let cancelled = false;

        const initMap = async () => {
            // 动态导入 Leaflet 避免 SSR 错误
            const L = (await import('leaflet')).default;

            // 确保 CSS 只加载一次
            if (!leafletLoaded) {
                // @ts-ignore
                await import('leaflet/dist/leaflet.css');
                leafletLoaded = true;
            }

            if (cancelled || !mapRef.current) return;

            // 清理已有实例
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            // 计算中心点和缩放
            const center = markers.length > 0
                ? [markers[0].lat, markers[0].lng] as [number, number]
                : [35.6762, 139.6503] as [number, number]; // 默认东京

            const zoom = mode === 'mini' ? 13 : (markers.length > 1 ? 5 : 13);

            const map = L.map(mapRef.current, {
                center,
                zoom,
                zoomControl: mode === 'full',
                attributionControl: mode === 'full',
                dragging: mode === 'full',
                scrollWheelZoom: mode === 'full',
                doubleClickZoom: mode === 'full',
                touchZoom: mode === 'full',
            });

            // OpenStreetMap 瓦片
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: mode === 'full'
                    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    : '',
                maxZoom: 19,
            }).addTo(map);

            // 自定义标记图标
            const markerIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div style="
                    width: 24px;
                    height: 24px;
                    background: var(--color-primary, #d97757);
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                </div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            // 添加标记点
            markers.forEach(marker => {
                const m = L.marker([marker.lat, marker.lng], { icon: markerIcon }).addTo(map);

                if (mode === 'full' && marker.name) {
                    m.bindPopup(`
                        <div style="font-family: Inter, system-ui, sans-serif; padding: 4px 0;">
                            <strong style="font-size: 14px;">${marker.name}</strong>
                            ${marker.memoNumber ? `<div style="font-size: 11px; color: #888; margin-top: 4px; font-family: monospace;">#${marker.memoNumber}</div>` : ''}
                        </div>
                    `);
                } else if (mode === 'mini') {
                    m.bindTooltip(marker.name, {
                        permanent: true,
                        direction: 'top',
                        offset: [0, -14],
                        className: 'map-tooltip-mini',
                    });
                }

                if (onMarkerClick) {
                    m.on('click', () => onMarkerClick(marker));
                }
            });

            // 多标记点时自动适配视野
            if (mode === 'full' && markers.length > 1) {
                const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]));
                map.fitBounds(bounds, { padding: [50, 50] });
            }

            mapInstanceRef.current = map;
        };

        initMap();

        return () => {
            cancelled = true;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [markers, mode, onMarkerClick]);

    const sizeClasses = mode === 'mini'
        ? 'w-[220px] h-[150px]'
        : 'w-full h-full min-h-[500px]';

    return (
        <div
            ref={mapRef}
            className={cn(
                'rounded-inner overflow-hidden',
                sizeClasses,
                className
            )}
            style={{ zIndex: 0 }}
        />
    );
}
