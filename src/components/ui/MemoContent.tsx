'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parseContentTokens } from '@/lib/contentParser';

interface MemoContentProps {
    content: string;
    className?: string;
}

import { CodeBlock } from './CodeBlock';
import { MemoHoverPreview } from './MemoHoverPreview';

export function MemoContent({ content, className }: MemoContentProps) {
    // 正则解析逻辑
    const renderContent = (text: string) => {
        const tokens = parseContentTokens(text);

        return (
            <p>
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
                                <div key={`img-${index}`} className="my-2 rounded-lg overflow-hidden border border-border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={token.value} alt="memo-image" className="max-h-64 object-contain bg-muted/20" loading="lazy" />
                                </div>
                            );
                        case 'code':
                            // Parse language if available? 
                            // contentParser currently returns raw value in code token.
                            // Usually code block is ```lang\ncode\n```.
                            // We should update parser to extract lang or just guess?
                            // If token.value is just the CONTENT of code block, we need language too.
                            // Let's assume parser provides it or we default to txt.
                            // Actually parser logic at `src/lib/contentParser.ts` needs check.
                            return (
                                <CodeBlock key={`code-${index}`} language="typescript" value={token.value} />
                            );
                        case 'text':
                        default:
                            return <span key={`text-${index}`}>{token.value}</span>;
                    }
                })}
            </p>
        );
    };

    return (
        <div className={cn("text-base leading-relaxed break-words whitespace-pre-wrap", className)}>
            {renderContent(content)}
        </div>
    );
}
