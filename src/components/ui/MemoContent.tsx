'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parseContentTokens } from '@/lib/contentParser';

interface MemoContentProps {
    content: string;
    className?: string;
}

export function MemoContent({ content, className }: MemoContentProps) {
    // 正则解析逻辑
    const renderContent = (text: string) => {
        const tokens = parseContentTokens(text);

        return (
            <p>
                {tokens.map((token, index) => {
                    switch (token.type) {
                        case 'ref':
                            return (
                                <span key={`ref-${index}`} className="text-primary hover:underline cursor-pointer font-mono bg-primary/10 px-1 rounded mx-0.5" title="引用功能开发中">
                                    {token.value}
                                </span>
                            );
                        case 'tag':
                            return (
                                <Link
                                    key={`tag-${index}`}
                                    href={`/?q=${token.value.slice(1)}`}
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
