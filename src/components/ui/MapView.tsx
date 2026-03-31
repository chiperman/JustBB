'use client';

import React, { useRef, useEffect } from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import type { MapMarker } from '@/lib/location-cache';
import { MemoCard } from '@/features/memos';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location04Icon } from '@hugeicons/core-free-icons';
import { createRoot } from 'react-dom/client';

export interface MapViewProps {
    markers: MapMarker[];
    mode: 'mini' | 'full';
    className?: string;
    interactive?: boolean;
    onMapClick?: (lat: number, lng: number) => void;
    onMarkerDragEnd?: (lat: number, lng: number) => void;
}

export function MapView({ 
    markers, 
    mode, 
    className, 
    interactive = false,
    onMapClick,
    onMarkerDragEnd
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<Leaflet.Map | null>(null);
    const clusterLayer = useRef<Leaflet.LayerGroup | null>(null);
    const leafletRef = useRef<typeof Leaflet | null>(null);

    useEffect(() => {
        const initLeaflet = async () => {
            if (!leafletRef.current) {
                const L_mod = (await import('leaflet')).default;
                leafletRef.current = L_mod;
            }
        };
        initLeaflet();
    }, []);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current || !leafletRef.current) return;

        const L = leafletRef.current;
        const map = L.map(mapRef.current, {
            center: [34.3416, 108.9398],
            zoom: mode === 'mini' ? 12 : 5,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: mode === 'full' || interactive
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map);

        if (mode === 'full') {
            L.control.zoom({ position: 'bottomright' }).addTo(map);
        }

        if (interactive) {
            map.on('click', (e: Leaflet.LeafletMouseEvent) => {
                onMapClick?.(e.latlng.lat, e.latlng.lng);
            });
        }

        mapInstance.current = map;
        clusterLayer.current = L.layerGroup().addTo(map);

        return () => {
            map.off();
            map.remove();
            mapInstance.current = null;
        };
    }, [mode, interactive, onMapClick]);

    useEffect(() => {
        if (!mapInstance.current || !clusterLayer.current || !leafletRef.current) return;

        const L = leafletRef.current;
        clusterLayer.current.clearLayers();

        const bounds: Leaflet.LatLngExpression[] = [];

        markers.forEach(marker => {
            const pos: Leaflet.LatLngExpression = [marker.lat, marker.lng];
            bounds.push(pos);

            const isDraggable = mode === 'mini' && interactive;

            const leafMarker = L.marker(pos, {
                draggable: isDraggable,
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="w-8 h-8 bg-primary/20 backdrop-blur-sm border-2 border-primary rounded-full flex items-center justify-center text-primary shadow-lg hover:scale-110 transition-transform">
                            <span class="text-[10px] font-bold">${marker.items.length || 1}</span>
                           </div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32]
                })
            });

            if (isDraggable) {
                leafMarker.on('dragend', (e) => {
                    const target = e.target as L.Marker;
                    const position = target.getLatLng();
                    onMarkerDragEnd?.(position.lat, position.lng);
                });
            } else if (marker.items.length > 0) {
                // 弹出层 (仅非编辑模式)
                const popupEl = document.createElement('div');
                popupEl.className = 'w-[320px] max-h-[400px] overflow-y-auto custom-scrollbar p-1';
                
                const root = createRoot(popupEl);
                root.render(
                    <div className="space-y-4">
                        <div className="px-2 pt-2 pb-1 border-b border-border/50">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <HugeiconsIcon icon={Location04Icon} size={14} />
                                <span className="text-sm truncate">{marker.name}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {marker.items.map(memo => (
                                <MemoCard key={memo.id} memo={memo} showOriginalOnly />
                            ))}
                        </div>
                    </div>
                );

                leafMarker.bindPopup(popupEl, {
                    maxWidth: 340,
                    className: 'modern-map-popup'
                });
            }

            leafMarker.addTo(clusterLayer.current!);
        });

        if (bounds.length > 0 && mode === 'full') {
            mapInstance.current.fitBounds(leafletRef.current.latLngBounds(bounds), { padding: [50, 50] });
        } else if (bounds.length > 0 && mode === 'mini') {
            mapInstance.current.setView(bounds[0], 13);
        }
    }, [markers, mode, interactive, onMarkerDragEnd]);

    return (
        <div className={cn("relative w-full h-full group", className)}>
            <div ref={mapRef} className="w-full h-full z-0" />
            {mode === 'full' && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="bg-background/80 backdrop-blur-md border border-border/50 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm pointer-events-none">
                        <HugeiconsIcon icon={Location04Icon} size={14} className="text-primary" />
                        <span className="text-[11px] font-medium tracking-tight">空间锚点预览</span>
                    </div>
                </div>
            )}
        </div>
    );
}
