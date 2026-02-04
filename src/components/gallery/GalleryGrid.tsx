'use client';

import { Memo } from '@/types/memo';
import { format } from 'date-fns';
import Link from 'next/link';

interface GalleryGridProps {
    memos: Memo[];
}

export function GalleryGrid({ memos }: GalleryGridProps) {
    if (!memos || memos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-muted-foreground bg-muted/10 rounded-3xl border border-dashed border-border/50">
                <p>暂无图片内容</p>
                <p className="text-xs opacity-50 mt-2">发布包含图片的 Memo 即可在此展示</p>
            </div>
        );
    }

    // Extract images
    const galleryItems = memos.map(memo => {
        const imgRegex = /!\[.*?\]\((.*?)\)/;
        const match = memo.content.match(imgRegex);
        return {
            ...memo,
            imageUrl: match ? match[1] : null
        };
    }).filter(item => item.imageUrl);

    return (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {galleryItems.map((item) => (
                <div key={item.id} className="break-inside-avoid group relative rounded-xl overflow-hidden bg-muted/10 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                    {/* Image */}
                    <div className="aspect-auto w-full relative">
                        <img
                            src={item.imageUrl || ''}
                            alt="Memo Image"
                            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <p className="text-white text-xs line-clamp-2 mb-2 font-medium leading-relaxed">
                                {item.content.replace(/!\[.*?\]\((.*?)\)/g, '').trim() || '图片分享'}
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-white/60">
                                <span>{format(new Date(item.created_at), 'yyyy-MM-dd')}</span>
                                <span className="px-2 py-0.5 bg-white/10 rounded-full backdrop-blur-sm">View</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
