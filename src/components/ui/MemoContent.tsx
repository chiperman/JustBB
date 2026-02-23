'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parseContentTokens } from '@/lib/contentParser';
import { CodeBlock } from './CodeBlock';
import { MemoHoverPreview } from './MemoHoverPreview';
import { useSearchParams } from 'next/navigation';
import { ImageZoom } from './ImageZoom';

interface MemoContentProps {
    content: string;
    className?: string;
}

export function MemoContent({ content, className }: MemoContentProps) {
    const searchParams = useSearchParams();
    const searchQuery = searchParams?.get('q') || '';

    // 解析并高亮文本
    const highlightText = (text: string, highlight: string) => {
        if (!highlight || !text) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <>
                {parts.map((part, i) => (
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-amber-200/60 text-foreground font-medium px-0.5 rounded-sm mx-px">
                            {part}
                        </span>
                    ) : part
                ))}
            </>
        );
    };

    // 正则解析逻辑
    const renderContent = (text: string) => {
        const tokens = parseContentTokens(text);

        return (
            <div role="presentation">
                {tokens.map((token, index) => {
                    switch (token.type) {
                        case 'ref':
                            const memoNum = token.value.slice(1);
                            return (
                                <MemoHoverPreview key={`ref-${index}`} memoNumber={memoNum} memoId={memoNum}>
                                    <Link
                                        href={`/?q=${memoNum}`}
                                        className="text-primary hover:underline cursor-pointer font-mono bg-primary/10 px-1 rounded-sm mx-0.5 inline-block focus-visible:ring-1 focus-visible:ring-primary/30 outline-none hover:bg-primary/20 transition-colors"
                                        aria-label={`查看引用记录 #${memoNum}`}
                                    >
                                        {token.value}
                                    </Link>
                                </MemoHoverPreview>
                            );
                        case 'tag':
                            return (
                                <Link
                                    key={`tag-${index}`}
                                    href={`/?tag=${encodeURIComponent(token.value.slice(1))}`}
                                    className="hover:underline mx-0.5 focus-visible:ring-1 focus-visible:ring-primary/30 outline-none rounded-sm transition-colors font-mono font-medium"
                                    style={{ color: '#5783f7' }}
                                    aria-label={`查看包含 #${token.value.slice(1)} 标签的记录`}
                                >
                                    {token.value}
                                </Link>
                            );
                        case 'image':
                            return (
                                <span
                                    key={`img-${index}`}
                                    className="block my-5 group relative max-w-full overflow-hidden"
                                >
                                    <div className="flex justify-center items-center">
                                        <div className="relative rounded-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-all duration-500 group-hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] group-hover:scale-[1.01]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <ImageZoom src={token.value} alt="记录中的图片附件">
                                                <img
                                                    src={token.value}
                                                    alt="记录中的图片附件"
                                                    className="max-h-[550px] w-auto object-contain block h-auto select-none"
                                                    loading="lazy"
                                                />
                                            </ImageZoom>
                                        </div>
                                    </div>
                                </span>
                            );
                        case 'code':
                            return (
                                <div key={`code-${index}`}>
                                    <CodeBlock language={token.lang || "typescript"} value={token.value} />
                                </div>
                            );
                        case 'text':
                        default:
                            return <span key={`text-${index}`} className="text-foreground/90">{highlightText(token.value, searchQuery)}</span>;
                    }
                })}
            </div>
        );
    };

    return (
        <div className={cn("text-base leading-relaxed break-words whitespace-pre-wrap flex flex-col gap-0", className)}>
            {renderContent(content)}
        </div>
    );
}
