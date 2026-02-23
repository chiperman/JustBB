'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
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
    /** 是否允许拖拽放大等交互，覆盖 mode 的默认限制 */
    interactive?: boolean;
    /** 标记拖拽结束回调 */
    onMarkerDragEnd?: (lat: number, lng: number) => void;
}

export function MapView({
    markers,
    mode = 'mini',
    className,
    interactive = false,
    onMarkerClick,
    onMapClick,
    onMarkerDragEnd
}: MapViewProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);

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
                    zoomControl: false,
                    attributionControl: mode === 'full',
                    dragging: mode !== 'mini' || interactive,
                    scrollWheelZoom: mode === 'mini' ? 'center' : true,
                    doubleClickZoom: mode !== 'mini' || interactive,
                    touchZoom: mode !== 'mini' || interactive,
                });

                if (onMapClick) {
                    map.on('click', (e: L.LeafletMouseEvent) => {
                        onMapClick(e.latlng.lat, e.latlng.lng);
                    });
                }

                mapInstanceRef.current = map;
            }

            const map = mapInstanceRef.current;
            if (!map) return;

            // 动态生成 CartoDB URL — 跟随应用主题自动切换
            // 浅色 → Voyager 彩色底图，深色 → Dark Matter 暗色底图
            const getCartoDbUrl = () => {
                const style = isDark ? 'dark_all' : 'rastertiles/voyager';
                return `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`;
            };

            // 添加或更新瓦片层
            const newTileUrl = getCartoDbUrl();
            if (!tileLayerRef.current) {
                // 初次创建瓦片层
                tileLayerRef.current = L.tileLayer(newTileUrl, {
                    attribution: mode === 'full' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' : '',
                    maxZoom: 20,
                }).addTo(map);
            } else {
                // 如果只改变了 URL，复用 layer 并刷新
                tileLayerRef.current.setUrl(newTileUrl);
            }

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
                    draggable: !!onMarkerDragEnd // 开启或禁止拖拽标记
                }).addTo(map);

                if (onMarkerDragEnd) {
                    m.on('dragend', (e: L.LeafletEvent) => {
                        const newPos = (e.target as L.Marker).getLatLng();
                        onMarkerDragEnd(newPos.lat, newPos.lng);
                    });
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
    }, [markers, mode, className, interactive, onMarkerClick, onMapClick, onMarkerDragEnd, isDark]);

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
                'rounded-inner overflow-hidden relative',
                sizeClasses,
                // 我们不再需要极简滤镜，CartoDB 原生配色足够完美
                className
            )}
            style={{ zIndex: 0 }}
        />
    );
}
