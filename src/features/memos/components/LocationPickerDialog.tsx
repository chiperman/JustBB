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
import { Search01Icon as SearchIcon, Loading03Icon as LoadingIcon, Location04Icon, Navigation03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useToast } from '@/hooks/use-toast';
import type { MapView as MapViewType } from '@/components/ui/MapView';
import { useHasMounted } from '@/hooks/useHasMounted';

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
    const { toast } = useToast();
    const hasMounted = useHasMounted();
    const [name, setName] = React.useState('');
    const [lat, setLat] = React.useState('');
    const [lng, setLng] = React.useState('');
    const [suggestions, setSuggestions] = React.useState<NominatimResult[]>([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [isGettingLocation, setIsGettingLocation] = React.useState(false);
    const [isSearching, setIsSearching] = React.useState(false);
    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSelectingRef = React.useRef<boolean>(false);

    const [MapView, setMapView] = React.useState<typeof MapViewType | null>(null);

    // 懒加载 MapView
    React.useEffect(() => {
        if (open && !MapView) {
            import('@/components/ui/MapView').then(mod => setMapView(() => mod.MapView));
        }
    }, [open, MapView]);

    const isValid = name.trim() && lat.trim() && lng.trim() &&
        !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

    const handleSearch = React.useCallback(async () => {
        if (!name.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        setShowSuggestions(true);

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=5`
            );
            const data: NominatimResult[] = await res.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Nominatim search error:', error);
            setSuggestions([]);
            toast({
                title: '搜索失败',
                description: '无法连接到地图服务，请稍后再试。',
                variant: 'destructive',
            });
        } finally {
            setIsSearching(false);
        }
    }, [name, toast]);

    // 自动防抖搜索 useEffect
    React.useEffect(() => {
        // 如果正在执行选中操作，或者名字过短，或者之前已经关闭了建议面板（意味着用户已经选定），就不自动搜索
        if (isSelectingRef.current || name.trim().length < 2) {
            isSelectingRef.current = false; // 重置标识
            return;
        }

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            handleSearch();
        }, 600);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [name, handleSearch]);

    if (!hasMounted) return null;

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({
                title: '当前浏览器不支持地理定位',
                description: '请手动输入经纬度。',
                variant: 'destructive',
            });
            return;
        }

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLat(latitude.toFixed(6).toString());
                setLng(longitude.toFixed(6).toString());

                // 反向地理编码获取简短地名
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();

                    if (data && data.display_name) {
                        const shortName = data.display_name.split(',')[0];
                        setName(shortName);
                    } else {
                        setName('当前位置');
                    }
                } catch (error) {
                    console.error('Nominatim reverse geocoding error:', error);
                    setName('当前位置');
                } finally {
                    setIsGettingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setIsGettingLocation(false);
                toast({
                    title: '获取位置失败',
                    description: error.message || '请检查浏览器定位权限',
                    variant: 'destructive',
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const handleSelectSuggestion = (s: NominatimResult) => {
        isSelectingRef.current = true; // 告诉 useEffect 当前是选择操作，不要触发后续网络请求
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
        ? [{ name: name || '选中位置', lat: parseFloat(lat), lng: parseFloat(lng), items: [] }]
        : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>添加定位</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2 relative">
                        <div className="flex items-center justify-between">
                            <label htmlFor="loc-name" className="text-sm font-medium">
                                地点名称
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleGetCurrentLocation}
                                disabled={isGettingLocation}
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                                {isGettingLocation ? (
                                    <HugeiconsIcon icon={LoadingIcon} size={12} className="animate-spin mr-1" />
                                ) : (
                                    <HugeiconsIcon icon={Navigation03Icon} size={12} className="mr-1" />
                                )}
                                使用当前位置
                            </Button>
                        </div>
                        <div className="relative">
                            <Input
                                id="loc-name"
                                value={name}
                                onChange={e => {
                                    // 每次输入时确保重置选择状态并激活搜索条件
                                    isSelectingRef.current = false;
                                    setName(e.target.value);
                                    if (showSuggestions) setShowSuggestions(false);
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                        handleSearch();
                                    }
                                }}
                                placeholder="输入地名搜索或直接输入"
                                className="w-full pr-10"
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                    handleSearch();
                                }}
                                disabled={isSearching || !name.trim()}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent hover:text-foreground active:scale-95 transition-all"
                            >
                                {isSearching ? (
                                    <HugeiconsIcon icon={LoadingIcon} size={14} className="animate-spin" />
                                ) : (
                                    <HugeiconsIcon icon={SearchIcon} size={14} />
                                )}
                            </Button>
                        </div>

                        {/* 搜索建议下拉框 */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-popover border rounded-md shadow-md py-1">
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
                    <div className="rounded-inner overflow-hidden ring-1 ring-black/5 dark:ring-white/10 relative group bg-muted/10">
                        {/* 左上角操作提示 */}
                        <div className="absolute top-2 left-2 z-[10] bg-background/90 backdrop-blur-md px-2 py-1 rounded text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border/50">
                            滚轮缩放 • 可拖移点
                        </div>

                        {MapView ? (
                            <MapView
                                markers={markers}
                                mode="mini"
                                interactive={true}
                                className="w-full h-[220px]"
                                onMapClick={(flat: number, flng: number) => {
                                    setLat(flat.toFixed(6).toString());
                                    setLng(flng.toFixed(6).toString());
                                }}
                                onMarkerDragEnd={(flat: number, flng: number) => {
                                    setLat(flat.toFixed(6).toString());
                                    setLng(flng.toFixed(6).toString());
                                }}
                            />
                        ) : (
                            <div className="w-full h-[220px] bg-muted/20 relative flex items-center justify-center overflow-hidden">
                                {/* 底层网格与径向渐变，制造空间纵深感 */}
                                <div className="absolute inset-0 z-0
                                    [background-image:radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background))_70%),linear-gradient(to_right,hsl(var(--muted-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground))_1px,transparent_1px)]
                                    [background-size:100%_100%,20px_20px,20px_20px]
                                    opacity-[0.08]"
                                />

                                {/* 中心发光与脉冲涟漪 */}
                                <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping duration-[3000ms]" />
                                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
                                        <div className="relative bg-background/50 border border-primary/20 backdrop-blur-sm p-3 rounded-full text-primary shadow-md flex items-center justify-center">
                                            <HugeiconsIcon icon={Location04Icon} size={24} className="animate-pulse" />
                                        </div>
                                    </div>

                                    {/* 毛玻璃徽章文本 */}
                                    <div className="px-3 py-1.5 bg-background/40 backdrop-blur-md border border-border/50 rounded-full shadow-sm">
                                        <span className="text-[11px] font-medium text-foreground/70 tracking-wide flex items-center gap-1.5">
                                            <HugeiconsIcon icon={LoadingIcon} size={12} className="animate-spin text-muted-foreground" />
                                            正在连接空间信标...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="ghost" className="active:scale-95 transition-all" onClick={() => onOpenChange(false)}>取消</Button>
                    <Button className="active:scale-95 transition-all" onClick={handleConfirm} disabled={!isValid}>确认</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
