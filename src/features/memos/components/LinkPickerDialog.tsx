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
import { Link01Icon, Loading03Icon as LoadingIcon, Globe02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useHasMounted } from '@/hooks/useHasMounted';
import { fetchLinkMetadata } from '@/lib/link-preview';

interface LinkPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** 用户确认后回调 */
    onConfirm: (title: string, url: string) => void;
    initialTitle?: string;
    initialUrl?: string;
    mode?: 'create' | 'edit';
}

export function LinkPickerDialog({ open, onOpenChange, onConfirm, initialTitle = '', initialUrl = '', mode = 'create' }: LinkPickerDialogProps) {
    const hasMounted = useHasMounted();
    const [title, setTitle] = React.useState(initialTitle);
    const [url, setUrl] = React.useState(initialUrl);
    const [isFetching, setIsFetching] = React.useState(false);
    const urlInputRef = React.useRef<HTMLInputElement>(null);
    const titleDirtyRef = React.useRef(false);
    const latestTitleRef = React.useRef(initialTitle);
    const latestUrlRef = React.useRef(initialUrl);
    const latestRequestIdRef = React.useRef(0);
    const lastFetchedUrlRef = React.useRef('');

    const isValid = url.trim() && /^https?:\/\/.+/.test(url.trim());

    React.useEffect(() => {
        latestUrlRef.current = url;
    }, [url]);

    React.useEffect(() => {
        latestTitleRef.current = title;
    }, [title]);

    const handleFetchTitle = React.useCallback(async (targetUrl: string) => {
        const normalizedUrl = targetUrl.trim();
        if (!normalizedUrl || !/^https?:\/\/.+/.test(normalizedUrl)) return;
        if (titleDirtyRef.current) return;
        if (lastFetchedUrlRef.current === normalizedUrl && latestTitleRef.current.trim()) return;

        const requestId = latestRequestIdRef.current + 1;
        latestRequestIdRef.current = requestId;
        setIsFetching(true);
        try {
            const meta = await fetchLinkMetadata(normalizedUrl);
            const nextTitle = meta?.title || meta?.domain || '';

            if (
                latestRequestIdRef.current !== requestId ||
                titleDirtyRef.current ||
                latestUrlRef.current.trim() !== normalizedUrl ||
                !nextTitle
            ) {
                return;
            }

            setTitle(nextTitle);
            lastFetchedUrlRef.current = normalizedUrl;
        } catch (error) {
            console.error('Fetch title error:', error);
        } finally {
            if (latestRequestIdRef.current === requestId) {
                setIsFetching(false);
            }
        }
    }, []);

    // 当弹窗打开时，处理初始化
    React.useEffect(() => {
        if (open) {
            if (mode === 'edit') {
                setTitle(initialTitle);
                setUrl(initialUrl);
                titleDirtyRef.current = initialTitle.trim().length > 0;
                latestUrlRef.current = initialUrl;
                lastFetchedUrlRef.current = '';
            } else {
                titleDirtyRef.current = false;
                latestUrlRef.current = '';
                lastFetchedUrlRef.current = '';
                // 创建模式下的剪贴板识别逻辑
                const checkClipboard = async () => {
                    try {
                        const text = await navigator.clipboard.readText();
                        if (text && /^https?:\/\/[^\s]+$/.test(text.trim())) {
                            const trimmedUrl = text.trim();
                            setUrl(trimmedUrl);
                            latestUrlRef.current = trimmedUrl;
                            handleFetchTitle(trimmedUrl);
                        }
                    } catch (e) {
                        console.debug('Clipboard read failed or denied:', e);
                    }
                };
                checkClipboard();
            }
        } else {
            // 关闭时重置
            setTitle('');
            setUrl('');
            setIsFetching(false);
            titleDirtyRef.current = false;
            latestUrlRef.current = '';
            lastFetchedUrlRef.current = '';
            latestRequestIdRef.current += 1;
        }
    }, [open, mode, initialTitle, initialUrl, handleFetchTitle]);

    const handleConfirm = () => {
        if (!isValid) return;
        const finalTitle = title.trim() || new URL(url).hostname;
        onConfirm(finalTitle, url.trim());
        onOpenChange(false);
    };

    if (!hasMounted) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HugeiconsIcon icon={Link01Icon} size={20} className="text-primary" />
                        添加链接
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label htmlFor="link-url" className="text-sm font-medium text-foreground/70">
                            网址 (URL)
                        </label>
                        <div className="relative">
                            <Input
                                id="link-url"
                                ref={urlInputRef}
                                value={url}
                                onChange={e => {
                                    const nextUrl = e.target.value;
                                    setUrl(nextUrl);
                                    latestUrlRef.current = nextUrl;
                                    if (nextUrl.trim() !== lastFetchedUrlRef.current) {
                                        lastFetchedUrlRef.current = '';
                                    }
                                }}
                                onBlur={() => handleFetchTitle(url)}
                                placeholder="https://example.com"
                                className="pr-10"
                                autoFocus
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                                <HugeiconsIcon icon={Globe02Icon} size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="link-title" className="text-sm font-medium text-foreground/70">
                                标题 (可选)
                            </label>
                            {isFetching && (
                                <span className="flex items-center gap-1.5 text-[11px] text-primary animate-pulse font-medium">
                                    <HugeiconsIcon icon={LoadingIcon} size={12} className="animate-spin" />
                                    正在获取标题...
                                </span>
                            )}
                        </div>
                        <Input
                            id="link-title"
                            value={title}
                            onChange={e => {
                                titleDirtyRef.current = true;
                                setTitle(e.target.value);
                            }}
                            placeholder={isFetching ? '读取中...' : '页面标题'}
                        />
                    </div>
                </div>
                <DialogFooter className="mt-2">
                    <Button variant="ghost" className="active:scale-95 transition-all" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button 
                        className="active:scale-95 transition-all px-6" 
                        onClick={handleConfirm} 
                        disabled={!isValid || isFetching}
                    >
                        确认添加
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
