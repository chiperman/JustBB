'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { parseContentTokens } from '@/lib/contentParser';
import { CodeBlock } from './CodeBlock';
import { MemoHoverPreview } from './MemoHoverPreview';
import { LocationHoverPreview } from './LocationHoverPreview';
import { useSearchParams } from 'next/navigation';
import { ImageZoom } from './ImageZoom';
import { LinkPreview } from './LinkPreview';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle01Icon as Check, Copy01Icon as Copy } from '@hugeicons/core-free-icons';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

interface MemoContentProps {
    content: string;
    className?: string;
    disablePreview?: boolean;
}

export function MemoContent({ content, className, disablePreview = false }: MemoContentProps) {
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
                        <span key={i} className="bg-amber-200/60 text-foreground font-medium px-0.5 rounded-md mx-px">
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
                            const linkElement = (
                                <Link
                                    href={`/?num=${memoNum}`}
                                    className="text-primary hover:underline cursor-pointer font-mono bg-primary/10 px-1 rounded-md mx-0.5 inline-block focus-visible:ring-1 focus-visible:ring-primary/30 outline-none hover:bg-primary/20 transition-colors"
                                    aria-label={`查看引用记录 #${memoNum}`}
                                >
                                    {token.value}
                                </Link>
                            );

                            return disablePreview ? (
                                <React.Fragment key={`ref-${index}`}>{linkElement}</React.Fragment>
                            ) : (
                                <MemoHoverPreview key={`ref-${index}`} memoNumber={memoNum} memoId={memoNum}>
                                    {linkElement}
                                </MemoHoverPreview>
                            );
                        case 'tag':
                            return (
                                <Link
                                    key={`tag-${index}`}
                                    href={`/?tag=${encodeURIComponent(token.value.slice(1))}`}
                                    className="text-primary hover:underline mx-0.5 focus-visible:ring-1 focus-visible:ring-primary/30 outline-none rounded-md transition-colors font-mono font-medium"
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
                                        <div className="relative rounded-md overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-all duration-500 group-hover:shadow-[0_8px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.04)] group-hover:scale-[1.01]">
                                            { }
                                            <ImageZoom src={token.value} alt="记录中的图片附件">
                                                <div className="relative max-h-[550px] w-full aspect-auto h-[300px]">
                                                    <Image
                                                        src={token.value}
                                                        alt="记录中的图片附件"
                                                        fill
                                                        className="object-contain select-none"
                                                        sizes="(max-width: 768px) 100vw, 800px"
                                                    />
                                                </div>
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
                        case 'location':
                            const locElement = (
                                <span
                                    className="inline-flex items-center gap-1 text-primary hover:underline cursor-pointer bg-primary/10 px-1.5 py-0.5 rounded mx-0.5 hover:bg-primary/20 transition-colors"
                                    aria-label={`查看定位: ${token.name}`}
                                >
                                    <span className="text-sm">📍</span>
                                    <span className="text-[13px] font-medium">{token.name}</span>
                                </span>
                            );

                            return disablePreview ? (
                                <React.Fragment key={`loc-${index}`}>{locElement}</React.Fragment>
                            ) : (
                                <LocationHoverPreview
                                    key={`loc-${index}`}
                                    name={token.name}
                                    lat={token.lat}
                                    lng={token.lng}
                                >
                                    {locElement}
                                </LocationHoverPreview>
                            );
                        case 'link':
                            return (
                                <LinkPreview key={`link-${index}`} url={token.value} />
                            );
                        case 'email':
                            return (
                                <EmailComponent key={`email-${index}`} email={token.value} />
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

function EmailComponent({ email }: { email: string }) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(email).then(() => {
            setCopied(true);
            toast({
                description: "邮件地址已复制到剪贴板",
                duration: 2000,
            });
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <span className="group/email inline">
            <span className="inline-flex w-0 group-hover/email:w-6 overflow-hidden transition-all duration-300 ease-in-out items-center align-middle shrink-0">
                <button
                    onClick={handleCopy}
                    className="p-1 rounded-md bg-primary/5 hover:bg-primary/10 text-primary transition-all focus:outline-none focus:ring-1 focus:ring-primary/30 mr-1 opacity-0 group-hover/email:opacity-100 border border-primary/10"
                    title="复制邮件地址"
                >
                    {copied ? (
                        <HugeiconsIcon icon={Check} size={14} />
                    ) : (
                        <HugeiconsIcon icon={Copy} size={14} />
                    )}
                </button>
            </span>
            <a
                href={`mailto:${email}`}
                className="text-primary transition-colors inline align-baseline"
                aria-label={`发送邮件至 ${email}`}
            >
                {email}
            </a>
        </span>
    );
}
