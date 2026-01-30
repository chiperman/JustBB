'use client';

import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, Loader2, Link as LinkIcon, Camera } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { MemoContent } from './MemoContent';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MemoShareProps {
    memo: {
        id: string;
        content: string;
        created_at: string;
        tags: string[];
    };
    trigger?: React.ReactNode;
}

export function MemoShare({ memo, trigger }: MemoShareProps) {
    const posterRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    // 生成链接：假设首页即详情页，通过 search query 定位
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/?q=${encodeURIComponent(memo.content.slice(0, 10))}`
        : '';

    const handleDownload = useCallback(async () => {
        if (!posterRef.current) return;

        try {
            setIsGenerating(true);
            // 第一次调用往往会慢或失败（字体加载问题），有时需要 warm up
            // 这里简单处理，直接调用
            const dataUrl = await toPng(posterRef.current, {
                cacheBust: true,
                pixelRatio: 2, // 高清
                backgroundColor: '#f5f5f4' // warm gray
            });

            const link = document.createElement('a');
            link.download = `memo-${memo.id.slice(0, 8)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Generarte poster failed', err);
            alert('生成海报失败，请重试');
        } finally {
            setIsGenerating(false);
        }
    }, [memo.id]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="p-2 hover:bg-muted rounded-full transition-colors outline-none" title="分享">
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md flex flex-col items-center">
                <DialogHeader>
                    <DialogTitle>生成海报分享</DialogTitle>
                </DialogHeader>

                {/* 预览/截图区域 */}
                <div className="w-full overflow-hidden rounded-lg shadow-sm border bg-stone-100 flex justify-center py-6">
                    <div
                        ref={posterRef}
                        className="w-[320px] bg-[#fffaf5] p-6 text-stone-800 relative shadow-lg flex flex-col gap-4"
                        style={{ fontFamily: 'serif' }} // 简单的衬线体增强质感
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                            <span className="text-sm font-bold tracking-widest uppercase text-stone-500">JustMemo</span>
                            <span className="text-xs text-stone-400 font-mono">
                                {format(new Date(memo.created_at), 'yyyy.MM.dd', { locale: zhCN })}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="py-2 min-h-[120px] text-sm leading-7 break-words whitespace-pre-wrap font-sans text-stone-700">
                            {/* 这里简单渲染文本，不带交互链接 */}
                            {memo.content}
                        </div>

                        {/* Tags */}
                        {memo.tags && memo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {memo.tags.map(t => (
                                    <span key={t} className="text-xs text-stone-400">#{t}</span>
                                ))}
                            </div>
                        )}

                        {/* Footer & QR */}
                        <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-end">
                            <div className="text-[10px] text-stone-400 leading-tight">
                                <p>Recorded via JustMemo</p>
                                <p>碎片化人文记录工具</p>
                            </div>
                            <div className="bg-white p-1 rounded-sm shadow-sm">
                                <QRCodeSVG
                                    value={shareUrl || 'https://justmemo.app'}
                                    size={48}
                                    fgColor="#44403c"
                                />
                            </div>
                        </div>

                        {/* 装饰性纹理或水印 */}
                        <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                    </div>
                </div>

                {/* 操作栏 */}
                <div className="flex gap-4 w-full mt-2">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        保存图片
                    </button>
                    <button
                        className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: 'JustMemo 分享',
                                    text: memo.content,
                                    url: shareUrl
                                }).catch(() => { }); // 忽略取消
                            } else {
                                // fallback copy
                                navigator.clipboard.writeText(`${memo.content}\n${shareUrl}`);
                                alert('链接与内容已复制');
                            }
                        }}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        更多分享
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
