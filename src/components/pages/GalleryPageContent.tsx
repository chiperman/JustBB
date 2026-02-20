'use client';

import { useEffect, useState } from 'react';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { Memo } from '@/types/memo';
import { usePageDataCache } from '@/context/PageDataCache';
import { getGalleryMemos } from '@/actions/fetchMemos';

interface GalleryPageContentProps {
    memos?: Memo[];
}

/**
 * 画廊页客户端内容组件
 * 支持两种模式：
 * 1. SSR：从 Server Component 接收 memos
 * 2. SPA：无 memos 时客户端自行获取
 */
export function GalleryPageContent({ memos: initialMemos }: GalleryPageContentProps) {
    const { getCache, setCache } = usePageDataCache();
    const cached = getCache('/gallery');
    const [memos, setMemos] = useState<Memo[]>(initialMemos ?? cached?.memos ?? []);
    const [isLoading, setIsLoading] = useState(!initialMemos && !cached);

    useEffect(() => {
        // 如果有初始数据（SSR），直接写入缓存
        if (initialMemos) {
            setCache('/gallery', { memos: initialMemos });
            return;
        }
        // stale-while-revalidate：缓存命中也后台刷新
        let cancelled = false;
        (async () => {
            const result = await getGalleryMemos();
            if (!cancelled) {
                const data = result || [];
                setMemos(data);
                setCache('/gallery', { memos: data });
                setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-10">
                <div className="max-w-screen-xl mx-auto space-y-12">
                    <section>
                        <header className="mb-10">
                            <h2 className="text-3xl font-serif font-bold tracking-tight mb-2 italic">画廊</h2>
                            <p className="text-muted-foreground text-sm font-sans tracking-wide opacity-70 italic whitespace-pre-line">
                                Visual fragments of memory. {"\n"}
                                每一张图片都是凝固的时间锚点。
                            </p>
                        </header>

                        {isLoading ? (
                            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                                {[180, 240, 160, 200].map((h, i) => (
                                    <div key={i} className="break-inside-avoid">
                                        <div className="p-2 bg-white dark:bg-black shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] rounded-sm border border-border/50">
                                            <div className="bg-muted/20 rounded-[1px] animate-pulse" style={{ height: `${h}px` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <GalleryGrid memos={memos} />
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
