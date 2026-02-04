'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
        <div className="relative group my-3 rounded-lg overflow-hidden border border-border">
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleCopy}
                    className="bg-muted/80 backdrop-blur-sm p-1.5 rounded-md hover:bg-background transition-colors text-xs flex items-center gap-1 border border-border/50"
                    title="Copy code"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    {copied && <span className="text-[10px] text-green-500 font-medium">Copied</span>}
                </button>
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
