'use client';

import { Memo } from '@/types/memo';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GalleryGridProps {
    memos: Memo[];
}

export function GalleryGrid({ memos }: GalleryGridProps) {
    if (!memos || memos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-muted-foreground bg-muted/5 rounded-sm border border-dashed border-border/50">
                <p className="font-serif italic text-lg opacity-60">暂无图片内容</p>
                <p className="text-xs opacity-40 mt-2">发布包含图片的 Memo 即可在此展示</p>
            </div>
        );
    }

    // Extract images and group by Month
    const galleryItems = memos.map(memo => {
        const imgRegex = /!\[.*?\]\((.*?)\)/;
        const match = memo.content.match(imgRegex);
        return {
            ...memo,
            imageUrl: match ? match[1] : null,
            dateObj: parseISO(memo.created_at)
        };
    }).filter(item => item.imageUrl);

    // Group items by "YYYY年MM月"
    const groupedItems = galleryItems.reduce((groups: Record<string, typeof galleryItems>, item) => {
        const month = format(item.dateObj, 'yyyy年MM月', { locale: zhCN });
        if (!groups[month]) groups[month] = [];
        groups[month].push(item);
        return groups;
    }, {});

    const months = Object.keys(groupedItems).sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-16">
            {months.map((month) => (
                <div key={month} className="space-y-8">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-serif font-bold italic tracking-tight text-primary/80">
                            {month}
                        </h3>
                        <div className="h-px flex-1 bg-border/20" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] opacity-50">
                            {groupedItems[month].length} 片段
                        </span>
                    </div>

                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {groupedItems[month].map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.5 }}
                                className="break-inside-avoid"
                            >
                                <div
                                    tabIndex={0}
                                    className={cn(
                                        "group relative overflow-hidden bg-muted/5 border border-border/50 hover:border-primary/40 transition-all duration-500 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary/30",
                                        "p-2 bg-white dark:bg-black shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] hover:shadow-2xl"
                                    )}
                                    aria-label={`查看由 ${format(item.dateObj, 'yyyy-MM-dd')} 发布的图片 Memo`}
                                >
                                    {/* Frame Effect - Inner Padding */}
                                    <div className="relative overflow-hidden aspect-auto rounded-[1px]">
                                        <img
                                            src={item.imageUrl || ''}
                                            alt="Memo multimedia content"
                                            className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                            loading="lazy"
                                        />

                                        {/* Premium Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
                                            <p className="text-white text-[11px] line-clamp-2 mb-2 font-sans leading-relaxed tracking-wide opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                                {item.content.replace(/!\[.*?\]\((.*?)\)/g, '').trim() || '图片分享'}
                                            </p>
                                            <div className="flex justify-between items-center text-[9px] text-white/50 font-mono tracking-tighter uppercase">
                                                <span>{format(item.dateObj, 'yyyy.MM.dd')}</span>
                                                <span className="px-2 py-0.5 bg-white/10 border border-white/10 rounded-sm" aria-hidden="true">Detail</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
