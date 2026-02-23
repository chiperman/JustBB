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
import { Search01Icon as SearchIcon, Loading03Icon as LoadingIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
}

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
    const [isSearching, setIsSearching] = React.useState(false);
    const [suggestions, setSuggestions] = React.useState<NominatimResult[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);

    const [MapView, setMapView] = React.useState<React.ComponentType<{
        markers: { name: string; lat: number; lng: number }[];
        mode: 'mini' | 'full';
        className?: string;
        onMarkerClick?: (marker: { name: string; lat: number; lng: number }) => void;
        onMapClick?: (lat: number, lng: number) => void;
        onMarkerDragEnd?: (lat: number, lng: number) => void;
    }> | null>(null);

    // 懒加载 MapView
    React.useEffect(() => {
        if (open && !MapView) {
            import('./MapView').then(mod => setMapView(() => mod.MapView));
        }
    }, [open, MapView]);

    const isValid = name.trim() && lat.trim() && lng.trim() &&
        !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

    const handleSearch = async () => {
        if (!name.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name.trim())}&limit=5`);
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Nominatim search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSuggestion = (s: NominatimResult) => {
        // 提取较短的名字作为显示名（通常是第一个逗号前的内容）
        const shortName = s.display_name.split(',')[0];
        setName(shortName);
        setLat(s.lat);
        setLng(s.lon);
        setShowSuggestions(false);
    };

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
        setSuggestions([]);
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
                    <div className="space-y-2 relative">
                        <label htmlFor="loc-name" className="text-sm font-medium">
                            地点名称
                        </label>
                        <div className="flex gap-2">
                            <Input
                                id="loc-name"
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    if (showSuggestions) setShowSuggestions(false);
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                                placeholder="输入地名搜索或直接输入"
                                className="flex-1"
                                autoFocus
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleSearch}
                                disabled={isSearching || !name.trim()}
                                className="shrink-0"
                            >
                                {isSearching ? (
                                    <HugeiconsIcon icon={LoadingIcon} size={16} className="animate-spin" />
                                ) : (
                                    <HugeiconsIcon icon={SearchIcon} size={16} />
                                )}
                            </Button>
                        </div>

                        {/* 搜索建议下拉框 */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-[calc(100%+4px)] left-0 right-10 z-50 bg-popover border rounded-md shadow-md py-1">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors truncate"
                                        onClick={() => handleSelectSuggestion(s)}
                                    >
                                        {s.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                        {showSuggestions && suggestions.length === 0 && !isSearching && (
                            <div className="absolute top-[calc(100%+4px)] left-0 right-10 z-50 bg-popover border rounded-md shadow-md py-3 text-center text-xs text-muted-foreground">
                                未找到相关地点
                            </div>
                        )}
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
                    <div className="rounded-inner overflow-hidden ring-1 ring-black/5 dark:ring-white/10 relative group">
                        <div className="absolute top-2 left-2 z-[10] bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            提示：点击地图或拖拽标记点以微调
                        </div>
                        {MapView ? (
                            <MapView
                                markers={markers}
                                mode="mini"
                                className="w-full h-[220px]"
                                onMapClick={(flat, flng) => {
                                    setLat(flat.toFixed(6).toString());
                                    setLng(flng.toFixed(6).toString());
                                }}
                                onMarkerDragEnd={(flat, flng) => {
                                    setLat(flat.toFixed(6).toString());
                                    setLng(flng.toFixed(6).toString());
                                }}
                            />
                        ) : (
                            <div className="w-full h-[220px] bg-muted/20 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">
                                    加载地图中…
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
