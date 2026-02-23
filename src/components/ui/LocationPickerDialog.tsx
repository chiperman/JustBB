'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LocationPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 用户确认选点后回调，返回 📍[name](lat,lng) 格式文本 */
    onConfirm: (locationText: string, name: string, lat: number, lng: number) => void;
}

export function LocationPickerDialog({ open, onOpenChange, onConfirm }: LocationPickerDialogProps) {
    const [name, setName] = React.useState('');
    const [lat, setLat] = React.useState('');
    const [lng, setLng] = React.useState('');
    const [MapView, setMapView] = React.useState<React.ComponentType<{
        markers: { name: string; lat: number; lng: number }[];
        mode: 'mini' | 'full';
        className?: string;
        onMarkerClick?: (marker: { name: string; lat: number; lng: number }) => void;
    }> | null>(null);
    const mapClickHandlerRef = React.useRef<((e: { latlng: { lat: number; lng: number } }) => void) | null>(null);

    // 懒加载 MapView
    React.useEffect(() => {
        if (open && !MapView) {
            import('./MapView').then(mod => setMapView(() => mod.MapView));
        }
    }, [open, MapView]);

    const isValid = name.trim() && lat.trim() && lng.trim() &&
        !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

    const handleConfirm = () => {
        if (!isValid) return;
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const locationText = `📍[${name.trim()}](${latNum}, ${lngNum})`;
        onConfirm(locationText, name.trim(), latNum, lngNum);
        // 重置状态
        setName('');
        setLat('');
        setLng('');
        onOpenChange(false);
    };

    const markers = lat.trim() && lng.trim() && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))
        ? [{ name: name || '选中位置', lat: parseFloat(lat), lng: parseFloat(lng) }]
        : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>添加定位</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="loc-name" className="text-sm font-medium">
                            地点名称
                        </label>
                        <Input
                            id="loc-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="例如：东京塔"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label htmlFor="loc-lat" className="text-sm font-medium">
                                纬度 (Latitude)
                            </label>
                            <Input
                                id="loc-lat"
                                type="number"
                                step="any"
                                value={lat}
                                onChange={e => setLat(e.target.value)}
                                placeholder="35.6586"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="loc-lng" className="text-sm font-medium">
                                经度 (Longitude)
                            </label>
                            <Input
                                id="loc-lng"
                                type="number"
                                step="any"
                                value={lng}
                                onChange={e => setLng(e.target.value)}
                                placeholder="139.7454"
                            />
                        </div>
                    </div>
                    {/* 地图预览 */}
                    <div className="rounded-inner overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                        {MapView && markers.length > 0 ? (
                            <MapView markers={markers} mode="mini" className="w-full h-[200px]" />
                        ) : (
                            <div className="w-full h-[200px] bg-muted/20 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">
                                    {!MapView ? '加载地图中…' : '输入坐标后预览'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button onClick={handleConfirm} disabled={!isValid}>确认</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
