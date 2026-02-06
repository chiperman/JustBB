'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SuggestionItem {
    id: string;
    label: string;
    subLabel?: string;
}

interface SuggestionListProps {
    items: SuggestionItem[];
    onSelect: (item: SuggestionItem) => void;
    activeIndex: number;
}

export function SuggestionList({ items, onSelect, activeIndex }: SuggestionListProps) {
    if (items.length === 0) return null;

    return (
        <div className="absolute z-50 bg-popover border border-border rounded-xl shadow-xl w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-1">
                {items.map((item, index) => (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col gap-0.5 transition-colors",
                            index === activeIndex ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                    >
                        <span className="font-medium">{item.label}</span>
                        {item.subLabel && (
                            <span className={cn(
                                "text-[10px] line-clamp-1 opacity-70",
                                index === activeIndex ? "text-primary-foreground" : "text-muted-foreground"
                            )}>
                                {item.subLabel}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
