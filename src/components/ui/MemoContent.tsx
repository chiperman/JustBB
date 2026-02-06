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
            <>
                {tokens.map((token, index) => {
                    switch (token.type) {
                        case 'ref':
                            const memoNum = token.value.slice(1);
                            return (
                                <MemoHoverPreview key={`ref-${index}`} memoNumber={memoNum} memoId={memoNum}>
                                    <Link
                                        href={`/?q=${memoNum}`}
                                        className="text-primary hover:underline cursor-pointer font-mono bg-primary/10 px-1 rounded mx-0.5 inline-block"
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
                                    className="text-primary hover:underline mx-0.5"
                                >
                                    {token.value}
                                </Link>
                            );
                        case 'image':
                            return (
                                <span key={`img-${index}`} className="block my-2 rounded-lg overflow-hidden border border-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={token.value} alt="memo-image" className="max-h-64 object-contain bg-muted/20 mx-auto" loading="lazy" />
                                </span>
                            );
                        case 'code':
                            return (
                                <div key={`code-${index}`} className="my-2">
                                    <CodeBlock language={token.lang || "typescript"} value={token.value} />
                                </div>
                            );
                        case 'text':
                        default:
                            return <span key={`text-${index}`}>{token.value}</span>;
                    }
                })}
            </>
        );
    };

    return (
        <div className={cn("text-base leading-relaxed break-words whitespace-pre-wrap", className)}>
            {renderContent(content)}
        </div>
    );
}
