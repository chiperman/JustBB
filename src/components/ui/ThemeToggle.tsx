'use client';

import * as React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoonIcon as Moon, Sun01Icon as Sun, ComputerIcon as Monitor } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Skeleton } from './skeleton';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Skeleton className="w-10 h-10 rounded-full" />;
    }

    const themes = [
        { name: 'light', icon: <HugeiconsIcon icon={Sun} size={16} />, label: '浅色' },
        { name: 'dark', icon: <HugeiconsIcon icon={Moon} size={16} />, label: '深色' },
        { name: 'system', icon: <HugeiconsIcon icon={Monitor} size={16} />, label: '自动' },
    ];

    const currentTheme = themes.find((t) => t.name === theme) || themes[2];

    const cycleTheme = () => {
        const currentIndex = themes.findIndex((t) => t.name === theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex].name);
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={cycleTheme}
            className="rounded-full w-10 h-10"
            title={`当前主题: ${currentTheme.label}`}
            aria-label={`切换主题，当前: ${currentTheme.label}`}
        >
            {currentTheme.name === 'light' && <HugeiconsIcon icon={Sun} size={16} aria-hidden="true" />}
            {currentTheme.name === 'dark' && <HugeiconsIcon icon={Moon} size={16} aria-hidden="true" />}
            {currentTheme.name === 'system' && <HugeiconsIcon icon={Monitor} size={16} aria-hidden="true" />}
        </Button>
    );
}
