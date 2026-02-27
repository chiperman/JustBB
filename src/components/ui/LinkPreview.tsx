'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchLinkMetadata, LinkMetadata } from '@/actions/link-preview';
import { HugeiconsIcon } from '@hugeicons/react';
import { Link01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface LinkPreviewProps {
    url: string;
    className?: string;
}

// Client-side cache for link metadata to prevent redundant fetches during a session
const metadataCache = new Map<string, LinkMetadata>();

export function LinkPreview({ url, className }: LinkPreviewProps) {
    const [metadata, setMetadata] = useState<LinkMetadata | null>(() => metadataCache.get(url) || null);
    const [loading, setLoading] = useState(!metadataCache.has(url));
    const [error, setError] = useState(false);

    // Uses an IntersectionObserver to only load preview when in view
    const observerRef = useRef<HTMLAnchorElement>(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setShouldLoad(true);
                observer.disconnect();
            }
        }, { rootMargin: '100px' });

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!shouldLoad) return;

        // If we already have metadata in cache, don't fetch again
        if (metadataCache.has(url)) {
            setMetadata(metadataCache.get(url)!);
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(false);

        const fetchMeta = async () => {
            try {
                const data = await fetchLinkMetadata(url);
                if (isMounted) {
                    if (data) {
                        setMetadata(data);
                        // Save to cache
                        metadataCache.set(url, data);
                    } else {
                        setError(true);
                    }
                }
            } catch {
                if (isMounted) {
                    setError(true);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchMeta();

        return () => {
            isMounted = false;
        };
    }, [url, shouldLoad]);

    if (!shouldLoad || loading) {
        return (
            <a
                ref={observerRef}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "my-3 flex items-center overflow-hidden rounded-card border border-border bg-card/50 h-[100px] sm:h-[120px] max-w-2xl",
                    className
                )}
            >
                <div className="w-24 sm:w-[120px] bg-muted/50 animate-pulse shrink-0 flex items-center justify-center h-full">
                    <HugeiconsIcon icon={Link01Icon} className="text-muted-foreground/30 animate-pulse" size={24} />
                </div>
                <div className="p-3 sm:p-4 flex-1 min-w-0 space-y-2 lg:space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="hidden sm:block h-3 bg-muted animate-pulse rounded w-full"></div>
                    <div className="hidden sm:block h-3 bg-muted animate-pulse rounded w-5/6"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4 mt-auto"></div>
                </div>
            </a>
        );
    }

    if (error || !metadata) {
        // Fallback to simple link with styling
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline font-mono bg-primary/10 px-1.5 py-0.5 rounded-md mx-0.5 hover:bg-primary/20 transition-colors max-w-full"
                title={url}
            >
                <HugeiconsIcon icon={Link01Icon} size={14} className="shrink-0" />
                <span className="truncate">{url}</span>
            </a>
        );
    }

    // Render full card
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "group my-3 flex items-stretch overflow-hidden rounded-card border border-border bg-card transition-all hover:bg-accent/50 hover:shadow-md hover:border-primary/30 max-w-2xl",
                "h-auto sm:h-[120px]", // fixed height on desktop for consistency
                className
            )}
            title={url}
        >
            {metadata.image ? (
                <div className="relative w-24 sm:w-[120px] shrink-0 overflow-hidden bg-muted border-r border-border h-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={metadata.image}
                        alt={metadata.title || "Link preview"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                            const icon = document.createElement('div');
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground/30"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
                            e.currentTarget.parentElement?.appendChild(icon.firstChild as Node);
                        }}
                    />
                </div>
            ) : (
                <div className="relative w-24 sm:w-[120px] shrink-0 overflow-hidden bg-primary/5 border-r border-border h-full flex items-center justify-center">
                    <HugeiconsIcon icon={Link01Icon} size={32} className="text-primary/30" />
                </div>
            )}
            <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 min-w-0">
                <div>
                    <h3 className="line-clamp-1 sm:line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {metadata.title || metadata.domain}
                    </h3>
                    <p className="mt-1 line-clamp-1 sm:line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {metadata.description || "点击前往查看详情"}
                    </p>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={`https://www.google.com/s2/favicons?domain=${metadata.domain}&sz=16`}
                        alt="favicon"
                        className="w-3 h-3 rounded-md opacity-80"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="truncate font-medium">{metadata.domain}</span>
                </div>
            </div>
        </a>
    );
}
