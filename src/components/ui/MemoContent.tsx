'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MemoContentProps {
    content: string;
    className?: string;
}

export function MemoContent({ content, className }: MemoContentProps) {
    // 正则解析逻辑
    const renderContent = (text: string) => {
        // 包含三种匹配模式：
        // 1. Tag匹配: #标签 (不含空格)
        // 2. 引用匹配: @数字 
        // 3. 图片直链: http(s)://...jpg/png/gif/webp
        // 4. 普通URL: http(s)://...

        // 目前先简单实现 @引用 和 #标签 和 图片URL 的拆解
        // 为了安全起见，不使用 dangerouslySetInnerHTML，而是拆分成 React Node 数组
        const regex = /(@\d+)|(#[\w\u4e00-\u9fa5]+)|(https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp))/g;

        const parts = text.split(regex);
        const matches = text.match(regex);

        if (!matches) return <p>{text}</p>;

        // 重新组合
        const result: React.ReactNode[] = [];
        let lastIndex = 0;

        text.replace(regex, (match, atRef, hashTag, imgUrl, index) => {
            // 添加匹配前的纯文本
            if (index > lastIndex) {
                result.push(<span key={`text-${index}`}>{text.slice(lastIndex, index)}</span>);
            }

            if (atRef) {
                // 处理 @123
                // TODO: 实现引用预览 Popover (后续任务)
                result.push(
                    <span key={`ref-${index}`} className="text-primary hover:underline cursor-pointer font-mono bg-primary/10 px-1 rounded mx-0.5" title="引用功能开发中">
                        {atRef}
                    </span>
                );
            } else if (hashTag) {
                // 处理 #标签
                result.push(
                    <Link
                        key={`tag-${index}`}
                        href={`/?q=${hashTag.slice(1)}`}
                        className="text-primary hover:underline mx-0.5"
                    >
                        {hashTag}
                    </Link>
                );
            } else if (imgUrl) {
                // 处理图片 URL -> 转换为 <img>
                result.push(
                    <div key={`img-${index}`} className="my-2 rounded-lg overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt="memo-image" className="max-h-64 object-contain bg-muted/20" loading="lazy" />
                    </div>
                );
            }

            lastIndex = index + match.length;
            return match;
        });

        // 添加剩余文本
        if (lastIndex < text.length) {
            result.push(<span key={`text-end`}>{text.slice(lastIndex)}</span>);
        }

        return <p>{result}</p>;
    };

    return (
        <div className={cn("text-base leading-relaxed break-words whitespace-pre-wrap", className)}>
            {renderContent(content)}
        </div>
    );
}
