'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { MapMarker } from '@/lib/location-cache';
import { MemoCard } from './MemoCard';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location04Icon } from '@hugeicons/core-free-icons';

// Leaflet CSS 需要在客户端动态导入
let leafletLoaded = false;

interface MapViewProps {
    /** 标记点列表 */
    markers: MapMarker[];
    /** mini: 悬浮预览小地图 (200x150), full: 全页地图 */
    mode?: 'mini' | 'full';
    /** 自定义 className */
    className?: string;
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
    onMapClick,
    onMarkerDragEnd
}: MapViewProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markerInstancesRef = useRef<Map<string, L.Marker>>(new Map());

    // 用存储 Portal 渲染的目标节点
    const [popupTarget, setPopupTarget] = useState<{ container: HTMLElement, marker: MapMarker } | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        let cancelled = false;

        const updateOrInitMap = async () => {
            const L = (await import('leaflet')).default;

            if (!leafletLoaded) {
                // @ts-ignore
                await import('leaflet/dist/leaflet.css');
                leafletLoaded = true;

                // 注入全局动画样式
                if (!document.getElementById('leaflet-marker-animations')) {
                    const style = document.createElement('style');
                    style.id = 'leaflet-marker-animations';
                    style.innerHTML = `
                        @keyframes marker-fade-in {
                            from { opacity: 0; transform: scale(0.5); }
                            to { opacity: 1; transform: scale(1); }
                        }
                        @keyframes marker-fade-out {
                            from { opacity: 1; transform: scale(1); }
                            to { opacity: 0; transform: scale(0.5); }
                        }
                        .marker-fade-in { animation: marker-fade-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                        .marker-fade-out { animation: marker-fade-out 0.3s ease-in forwards; }
                        .custom-map-marker { transition: all 0.3s ease; }
                    `;
                    document.head.appendChild(style);
                }
            }

            if (cancelled || !mapRef.current) return;

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

                map.on('popupopen', (e) => {
                    const container = e.popup.getElement()?.querySelector('.leaflet-popup-content') as HTMLElement;
                    if (container) {
                        // @ts-ignore
                        const markerData = e.popup._source._markerData;
                        setPopupTarget({ container, marker: markerData });
                    }
                });

                map.on('popupclose', () => {
                    setPopupTarget(null);
                });

                mapInstanceRef.current = map;
            }

            const map = mapInstanceRef.current;
            if (!map) return;

            const getCartoDbUrl = () => {
                const style = isDark ? 'dark_all' : 'rastertiles/voyager';
                return `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`;
            };

            const newTileUrl = getCartoDbUrl();
            if (!tileLayerRef.current) {
                tileLayerRef.current = L.tileLayer(newTileUrl, {
                    attribution: mode === 'full' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' : '',
                    maxZoom: 20,
                }).addTo(map);
            } else {
                tileLayerRef.current.setUrl(newTileUrl);
            }

            // --- 标记点 Diffing 逻辑 ---
            const currentMarkers = markerInstancesRef.current;
            const nextMarkersMap = new Map<string, MapMarker>();
            markers.forEach(m => nextMarkersMap.set(`${m.lat.toFixed(6)},${m.lng.toFixed(6)}`, m));

            // 1. 移除不再需要的点
            for (const [key, markerInstance] of currentMarkers.entries()) {
                if (!nextMarkersMap.has(key)) {
                    const el = markerInstance.getElement()?.querySelector('.marker-icon-inner');
                    if (el) {
                        el.classList.remove('marker-fade-in');
                        el.classList.add('marker-fade-out');
                        setTimeout(() => {
                            if (map.hasLayer(markerInstance)) map.removeLayer(markerInstance);
                        }, 300);
                    } else {
                        map.removeLayer(markerInstance);
                    }
                    currentMarkers.delete(key);
                }
            }

            // 2. 添加新点或更新旧点
            const markerIcon = L.divIcon({
                className: 'custom-map-marker', // 仅作为容器，不应用 transform 动画
                html: `<div class="marker-icon-inner marker-fade-in" style="width: 24px; height: 24px; background: var(--color-primary, #d97757); border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            nextMarkersMap.forEach((markerData, key) => {
                if (!currentMarkers.has(key)) {
                    const m = L.marker([markerData.lat, markerData.lng], {
                        icon: markerIcon,
                        draggable: !!onMarkerDragEnd
                    }).addTo(map);

                    // @ts-ignore
                    m._markerData = markerData;
                    m.bindPopup('<div class="react-popup-root"></div>', {
                        maxWidth: 550,
                        minWidth: 400,
                        className: 'modern-map-popup'
                    });

                    if (onMarkerDragEnd) {
                        m.on('dragend', (e: L.LeafletEvent) => {
                            const newPos = (e.target as L.Marker).getLatLng();
                            onMarkerDragEnd(newPos.lat, newPos.lng);
                        });
                    }
                    currentMarkers.set(key, m);
                } else {
                    // 如果点已存在，只同步数据（不重绘标记以保持动画平滑）
                    const existingMarker = currentMarkers.get(key)!;
                    // @ts-ignore
                    existingMarker._markerData = markerData;
                }
            });

            // 3. 视野调整 (仅在数据初次加载或显著变化时执行)
            if (markers.length === 1 && !cancelled) {
                map.setView([markers[0].lat, markers[0].lng], map.getZoom(), { animate: true });
            } else if (mode === 'full' && markers.length > 1 && currentMarkers.size === markers.length) {
                // 只有在点全部添加完成后才计算 bounds，避免中间过程产生抖动
                const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number]));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        };

        updateOrInitMap();

        return () => {
            cancelled = true;
        };
    }, [markers, mode, interactive, onMapClick, onMarkerDragEnd, isDark]);

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
                className
            )}
            style={{ zIndex: 0 }}
        >
            {popupTarget && createPortal(
                <div className="flex flex-col max-h-[600px] w-full">
                    <div className="p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10 rounded-t-card">
                        <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
                            <HugeiconsIcon icon={Location04Icon} size={16} />
                            <span className="truncate">{popupTarget.marker.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono tabular-nums opacity-60">
                            {popupTarget.marker.lat.toFixed(6)}, {popupTarget.marker.lng.toFixed(6)}
                        </div>
                    </div>
                    <div className="overflow-y-auto px-4 pb-4 pt-4 custom-scrollbar flex-1 bg-muted/20">
                        <div className="flex flex-col gap-4">
                            {popupTarget.marker.items.map((memo) => (
                                <MemoCard
                                    key={memo.id}
                                    memo={memo}
                                    showOriginalOnly={true}
                                />
                            ))}
                        </div>
                    </div>
                </div>,
                popupTarget.container
            )}
        </div>
    );
}
