'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from './input';

export function SearchInput() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        replace(`/?${params.toString()}`);
    }, 300);

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
                type="text"
                placeholder="搜索记录..."
                className="pl-9"
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('q')?.toString()}
            />
        </div>
    );
}
