'use client';

import { useState, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from './input';
import { Button } from './button';

export function SearchInput() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    const [value, setValue] = useState(searchParams.get('q') || '');

    const performSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term.trim()) {
            params.set('q', term.trim());
        } else {
            params.delete('q');
        }
        replace(`/?${params.toString()}`);
    };

    const handleClear = () => {
        setValue('');
        performSearch('');
    };

    return (
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 transition-colors">
                <HugeiconsIcon
                    icon={Search01Icon}
                    size={16}
                    className={value ? "text-primary/70" : "text-muted-foreground/50"}
                />
            </div>
            <Input
                type="text"
                placeholder="键入关键字并按下回车搜索..."
                className="pl-9 pr-10 rounded-sm border-border bg-background focus:bg-accent/5 transition-all outline-none ring-0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        performSearch(value);
                    }
                }}
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground/30 hover:text-muted-foreground transition-colors z-20"
                    title="清空搜索"
                >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
            )}
        </div>
    );
}
