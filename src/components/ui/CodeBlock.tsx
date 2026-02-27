'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon as Copy, CheckmarkCircle01Icon as Check } from '@hugeicons/core-free-icons';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
    language: string;
    value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative my-4 rounded-lg overflow-hidden border border-border/60 bg-muted/30 shadow-sm">
            <div className="absolute right-2 top-2 z-10 group opacity-0 hover:opacity-100 transition-opacity">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 px-2 text-xs bg-background/80 hover:bg-background backdrop-blur-md shadow-sm border border-border"
                    title="Copy code"
                >
                    {copied ? <HugeiconsIcon icon={Check} size={14} className="text-primary" /> : <HugeiconsIcon icon={Copy} size={14} />}
                    {copied && <span className="text-[10px] text-primary font-medium ml-1">Copied</span>}
                </Button>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={vscDarkPlus}
                customStyle={{ margin: 0, padding: '1rem', fontSize: '0.875rem', borderRadius: 0 }}
                wrapLines={true}
                wrapLongLines={true}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
}
