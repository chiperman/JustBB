'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parseContentTokens } from '@/lib/contentParser';
import { CodeBlock } from './CodeBlock';
import { MemoHoverPreview } from './MemoHoverPreview';

interface MemoContentProps {
    content: string;
    className?: string;
}

export function MemoContent({ content, className }: MemoContentProps) {
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
                                    className="text-primary hover:underline mx-0.5 focus-visible:ring-1 focus-visible:ring-primary/30 outline-none rounded-sm hover:bg-primary/10 transition-colors"
                                    aria-label={`查看包含 #${token.value.slice(1)} 标签的记录`}
                                >
                                    {token.value}
                                </Link>
                            );
                        case 'image':
                            return (
                                <span key={`img-${index}`} className="block my-2 rounded overflow-hidden border border-border bg-muted/5 shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={token.value} alt="记录中的图片附件" className="max-h-80 object-contain mx-auto transition-transform hover:scale-[1.02] duration-300" loading="lazy" />
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
                            return <span key={`text-${index}`} className="text-foreground/90">{token.value}</span>;
                    }
                })}
            </div>
        );
    };

    return (
        <div className={cn("text-base leading-relaxed break-words whitespace-pre-wrap", className)}>
            {renderContent(content)}
        </div>
    );
}
