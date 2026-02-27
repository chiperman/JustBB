'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import type { MapMarker } from '@/lib/location-cache';
import { MemoCard } from './MemoCard';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location04Icon, ZoomInAreaIcon } from '@hugeicons/core-free-icons';

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
    // 定义聚合组类型：标准 FeatureGroup + 插件提供的 addLayers/removeLayers/hasLayer 方法
    type MarkerClusterGroup = L.FeatureGroup & {
        addLayers: (layers: L.Layer[]) => void;
        removeLayers: (layers: L.Layer[]) => void;
    };
    const markerClusterGroupRef = useRef<MarkerClusterGroup | null>(null);

    // 用存储 Portal 渲染的目标节点
    const [popupTarget, setPopupTarget] = useState<{ container: HTMLElement, marker: MapMarker } | null>(null);
    const [currentZoom, setCurrentZoom] = useState<number | null>(null);
    const [showZoomIndicator, setShowZoomIndicator] = useState(false);
    const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        let cancelled = false;

        const updateOrInitMap = async () => {
            const L = (await import('leaflet')).default;

            // 确保 Leaflet 挂载到全局，供陈旧插件使用
            if (typeof window !== 'undefined') {
                (window as unknown as { L: typeof L }).L = L;
            }

            if (!leafletLoaded) {
                // 加载核心样式
                // @ts-expect-error External CSS import
                await import('leaflet/dist/leaflet.css');

                // 只有在浏览器环境下才动态加载插件
                if (typeof window !== 'undefined') {
                    try {
                        // 动态导入聚合插件的 CSS
                        // @ts-expect-error External CSS import
                        await import('leaflet.markercluster/dist/MarkerCluster.css');
                        // @ts-expect-error External CSS import
                        await import('leaflet.markercluster/dist/MarkerCluster.Default.css');

                        // 动态加载逻辑核心 (MarkerCluster 必须在 L 存在后加载)
                        await import('leaflet.markercluster');
                    } catch (e) {
                        console.error('Failed to load markercluster plugin:', e);
                    }
                }

                leafletLoaded = true;
            }

            if (cancelled || !mapRef.current) return;

            if (!mapInstanceRef.current) {
                const center = markers.length > 0
                    ? [markers[0].lat, markers[0].lng] as [number, number]
                    : [35.6762, 139.6503] as [number, number];

                // 如果只有一个点或者处于 full 模式且有多个点，均默认放大至 12 级以聚焦最新地点
                const zoom = mode === 'mini' ? 13 : (markers.length > 0 ? 12 : 5);

                // 动态计算最小缩放级别，使地图能铺满容器宽度
                // 假设瓦片大小为256px，0级缩放时整个世界宽度为256px
                // 宽度缩放公式：width = 256 * 2^zoom
                // 因此所需最小zoom: zoom = log2(containerWidth / 256)
                const containerWidth = mapRef.current.clientWidth;
                // 为了稍微增加一点宽容度，向上取一点点
                const calculatedMinZoom = Math.max(2, Math.ceil(Math.log2(containerWidth / 256)));

                const map = L.map(mapRef.current, {
                    center,
                    zoom,
                    maxZoom: 20,
                    minZoom: calculatedMinZoom, // 动态计算，避免左右出现灰边
                    maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)), // 限制拖拽边界到真实世界的经纬度极值
                    maxBoundsViscosity: 1.0, // 边界完全粘性，不允许拖出界
                    zoomControl: false,
                    attributionControl: mode === 'full',
                    dragging: mode !== 'mini' || interactive,
                    scrollWheelZoom: mode === 'mini' ? 'center' : true,
                    doubleClickZoom: mode !== 'mini' || interactive,
                    touchZoom: mode !== 'mini' || interactive,
                    fadeAnimation: true,
                    zoomAnimation: true,
                    markerZoomAnimation: true
                });

                // 处理窗口大小改变时的 minZoom 更新
                const handleResize = () => {
                    if (!mapRef.current || !mapInstanceRef.current) return;
                    const newWidth = mapRef.current.clientWidth;
                    const newMinZoom = Math.max(2, Math.ceil(Math.log2(newWidth / 256)));
                    if (newMinZoom !== mapInstanceRef.current.getMinZoom()) {
                        mapInstanceRef.current.setMinZoom(newMinZoom);
                    }
                };
                window.addEventListener('resize', handleResize);
                // 保存清理函数以供后续移除
                // @ts-expect-error Custom property on map instance
                map._cleanupResize = () => window.removeEventListener('resize', handleResize);

                if (onMapClick) {
                    map.on('click', (e: L.LeafletMouseEvent) => {
                        onMapClick(e.latlng.lat, e.latlng.lng);
                    });
                }

                map.on('popupopen', (e) => {
                    const container = e.popup.getElement()?.querySelector('.leaflet-popup-content') as HTMLElement;
                    if (container) {
                        // @ts-expect-error Internal property access
                        const markerData = e.popup._source._markerData as MapMarker;
                        setPopupTarget({ container, marker: markerData });

                        // 获取真实的弹窗高度以计算平移居中（延迟给 React Portal 渲染时间）
                        setTimeout(() => {
                            const popupElement = e.popup.getElement();
                            if (!popupElement || !mapInstanceRef.current) return;

                            // 这里的 popupElement 实际上包含了箭头
                            const popupHeight = popupElement.offsetHeight;

                            // 获取目标点的原始地理坐标 (LatLng)
                            const latlng = e.popup.getLatLng();
                            if (!latlng) return;

                            // 通过 map project 把目标点转换为屏幕上的像素坐标
                            const px = mapInstanceRef.current.project(latlng);

                            // 从目标点向屏幕上方偏移 `Popup高度的一半` + `一定的冗余(20px, 大概是箭头的容错)`
                            // 这样标记加上弹窗的整体就在屏幕Y轴中心了
                            px.y -= (popupHeight / 2 + 20);

                            // unproject 转回地理坐标，进行平滑过渡 (animate) 
                            mapInstanceRef.current.panTo(mapInstanceRef.current.unproject(px), {
                                animate: true,
                                duration: 0.5
                            });

                        }, 50); // 给 React 50ms 注入 DOM 的时间
                    }
                });

                map.on('popupclose', () => {
                    setPopupTarget(null);
                });

                mapInstanceRef.current = map;
            }

            const map = mapInstanceRef.current;
            if (!map) return;

            // 初始化或获取聚合组
            if (!markerClusterGroupRef.current) {
                // 安全检查：由于插件加载可能是异步且有副作用的，确保函数存在
                if (typeof L.markerClusterGroup === 'function') {
                    markerClusterGroupRef.current = (L as unknown as { markerClusterGroup: (options: object) => MarkerClusterGroup }).markerClusterGroup({
                        showCoverageOnHover: true,
                        zoomToBoundsOnClick: false, // 禁用原生直接缩放，改为下面我们自定义的飞行缩放
                        spiderfyOnMaxZoom: true,
                        spiderLegPolylineOptions: { weight: 0, opacity: 0 }, // 隐藏展开时两点之间画出的连线（蜘蛛腿）
                        maxClusterRadius: 40, // 适当调小半径，让聚合更精准
                        animateAddingMarkers: false, // 禁用分步拆解动画以避免计算偏移坐标导致的视觉滞后
                        iconCreateFunction: (cluster: { getChildCount: () => number }) => {
                            return L.divIcon({
                                html: `<div style="width: 100%; height: 100%; background: rgba(217, 119, 87, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                                         <div style="width: 32px; height: 32px; background: var(--color-primary, #d97757); border: 2px solid white; border-radius: 50%; color: white; font-weight: bold; font-size: 13px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(217, 119, 87, 0.4); transition: transform 0.2s ease;" onmouseenter="this.style.transform='scale(1.1)'" onmouseleave="this.style.transform='scale(1)'">
                                           <span>${cluster.getChildCount()}</span>
                                         </div>
                                       </div>`,
                                className: '',
                                iconSize: L.point(40, 40)
                            });
                        }
                    }) as MarkerClusterGroup;

                    markerClusterGroupRef.current.on('clusterclick', (a: { layer: { getBounds: () => L.LatLngBounds, spiderfy: () => void } }) => {
                        const bounds = a.layer.getBounds();
                        const targetZoom = map.getBoundsZoom(bounds);
                        const maxZoom = map.getMaxZoom();

                        // 如果需要的展开层级已大于或等于地图极限，说明里面的几个点可能坐标极度贴近甚至完全重合
                        if (targetZoom >= maxZoom || map.getZoom() >= maxZoom) {
                            // 调用原生展开蜘蛛腿
                            a.layer.spiderfy();
                        } else {
                            // 否则优雅地平滑飞行到恰好能包涵这批点的最佳层级
                            map.flyToBounds(bounds, {
                                padding: [50, 50],
                                duration: 0.8,
                                easeLinearity: 0.25
                            });
                        }
                    });
                } else {
                    console.warn('L.markerClusterGroup is not available, falling back to basic layer group');
                    markerClusterGroupRef.current = L.featureGroup() as MarkerClusterGroup;
                }
                map.addLayer(markerClusterGroupRef.current);
            }
            const clusterGroup = markerClusterGroupRef.current;

            const getCartoDbUrl = () => {
                const style = isDark ? 'dark_all' : 'rastertiles/voyager';
                return `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}@2x.png`;
            };

            const newTileUrl = getCartoDbUrl();
            if (!tileLayerRef.current) {
                tileLayerRef.current = L.tileLayer(newTileUrl, {
                    attribution: mode === 'full' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' : '',
                    maxZoom: 20,
                    minZoom: 2,
                    maxNativeZoom: 18, // 超过 18 级放大时，不发请求，直接拉伸已有图片，解决高比率由于无数据或限流导致的白屏/慢加载
                    noWrap: true, // 禁止瓦片在水平方向上重复
                }).addTo(map);
            } else {
                tileLayerRef.current.setUrl(newTileUrl);
            }

            // --- 标记点 Diffing 与 聚合逻辑 ---
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
                            if (clusterGroup.hasLayer(markerInstance)) clusterGroup.removeLayer(markerInstance);
                        }, 300);
                    } else {
                        clusterGroup.removeLayer(markerInstance);
                    }
                    currentMarkers.delete(key);
                }
            }

            // 2. 添加新点或更新旧点
            const markerIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div class="marker-icon-inner marker-fade-in" style="width: 24px; height: 24px; background: var(--color-primary, #d97757); border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            const newLayers: L.Marker[] = [];
            nextMarkersMap.forEach((markerData, key) => {
                if (!currentMarkers.has(key)) {
                    const m = L.marker([markerData.lat, markerData.lng], {
                        icon: markerIcon,
                        draggable: !!onMarkerDragEnd
                    });

                    // @ts-expect-error Custom data property on marker
                    m._markerData = markerData;

                    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 600;
                    const popupMaxWidth = Math.min(550, windowWidth - 40);
                    const popupMinWidth = Math.min(300, windowWidth - 60);

                    m.bindPopup('<div class="react-popup-root"></div>', {
                        maxWidth: popupMaxWidth,
                        minWidth: popupMinWidth,
                        className: 'modern-map-popup',
                        autoPan: false // 禁用原生自动平移，使用上面我们自己计算的居中平移
                    });

                    if (onMarkerDragEnd) {
                        m.on('dragend', (e: L.LeafletEvent) => {
                            const newPos = (e.target as L.Marker).getLatLng();
                            onMarkerDragEnd(newPos.lat, newPos.lng);
                        });
                    }
                    newLayers.push(m);
                    currentMarkers.set(key, m);
                } else {
                    const existingMarker = currentMarkers.get(key)!;
                    // @ts-expect-error Custom data property on marker
                    existingMarker._markerData = markerData;
                }
            });

            if (newLayers.length > 0) {
                clusterGroup.addLayers(newLayers);
            }

            // 3. 视野调整: 加载完成时始终通过动画流利地飞去/移动至最新定位，而不是看到所有的散点
            if (markers.length > 0 && !cancelled) {
                // 判断当前视野与目标点是否相距较远，如果较远可考虑 flyTo 效果，较近使用 setView 效果。默认使用 animate: true
                // 这里统一聚焦到第一个点（最新一条记录），默认给 12 级的合适视野
                const targetZoom = map.getZoom() < 12 ? 12 : map.getZoom();
                map.setView([markers[0].lat, markers[0].lng], targetZoom, { animate: true, duration: 1.0 });
            }

            // --- 附加功能: 记录并同步当前层级 ---
            setCurrentZoom(map.getZoom());

            const handleZoomActivity = () => {
                setCurrentZoom(map.getZoom());
                setShowZoomIndicator(true);

                if (zoomTimeoutRef.current) {
                    clearTimeout(zoomTimeoutRef.current);
                }

                zoomTimeoutRef.current = setTimeout(() => {
                    setShowZoomIndicator(false);
                }, 1500);
            };

            map.on('zoomstart', handleZoomActivity);
            map.on('zoom', handleZoomActivity);
            map.on('zoomend', handleZoomActivity);

        };

        updateOrInitMap();

        return () => {
            cancelled = true;
        };
    }, [markers, mode, interactive, onMapClick, onMarkerDragEnd, isDark]);

    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                // @ts-expect-error Custom cleanup property
                if (mapInstanceRef.current._cleanupResize) {
                    // @ts-expect-error Custom cleanup property
                    mapInstanceRef.current._cleanupResize();
                }
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            if (zoomTimeoutRef.current) {
                clearTimeout(zoomTimeoutRef.current);
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
            {/* 底部正中缩放层级指示器 */}
            {currentZoom !== null && (
                <div className={cn(
                    "absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] flex items-center justify-center transition-opacity duration-300",
                    showZoomIndicator ? "opacity-100" : "opacity-0 pointer-events-none"
                )}>
                    <div className="bg-background/80 backdrop-blur-md border border-border/50 text-foreground text-xs font-mono px-3 py-1.5 rounded-full shadow-md select-none flex items-center gap-2">
                        <HugeiconsIcon icon={ZoomInAreaIcon} size={14} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Zoom</span>
                        <span className="font-semibold">{currentZoom}</span>
                    </div>
                </div>
            )}

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
