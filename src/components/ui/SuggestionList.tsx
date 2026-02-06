'use client';

import { cn } from '@/lib/utils';

export interface SuggestionItem {
    id: string;
    label: string;
    subLabel?: string;
    count?: number;
    memo_number?: number;
}

interface SuggestionListProps {
    items: SuggestionItem[];
    activeIndex: number;
    onSelect: (item: SuggestionItem) => void;
}

export function SuggestionList({ items, activeIndex, onSelect }: SuggestionListProps) {
    if (items.length === 0) return null;

    return (
        <ul
            role="listbox"
            className="bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[240px] py-1 animate-in fade-in zoom-in-95 duration-200"
        >
            {items.map((item, index) => (
                <li
                    key={item.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    onClick={() => onSelect(item)}
                    className={cn(
                        "px-4 py-2 cursor-pointer flex justify-between items-center transition-colors outline-none",
                        index === activeIndex ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                    )}
                >
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.label}</span>
                        {item.subLabel && (
                            <span className={cn(
                                "text-xs line-clamp-1 opacity-70",
                                index === activeIndex ? "text-primary" : "text-muted-foreground"
                            )}>
                                {item.subLabel}
                            </span>
                        )}
                    </div>
                    {(item.count !== undefined || item.memo_number !== undefined) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.count !== undefined && <span className="opacity-60">{item.count}</span>}
                            {item.memo_number !== undefined && <span className="font-mono bg-muted px-1 rounded">#{item.memo_number}</span>}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}
