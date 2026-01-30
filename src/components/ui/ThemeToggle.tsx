'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="p-2 w-10 h-10 border border-border rounded-full opacity-0" />;
    }

    const themes = [
        { name: 'light', icon: <Sun className="w-4 h-4" />, label: '浅色' },
        { name: 'dark', icon: <Moon className="w-4 h-4" />, label: '深色' },
        { name: 'system', icon: <Monitor className="w-4 h-4" />, label: '自动' },
    ];

    const currentTheme = themes.find((t) => t.name === theme) || themes[2];

    const cycleTheme = () => {
        const currentIndex = themes.findIndex((t) => t.name === theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex].name);
    };

    return (
        <button
            onClick={cycleTheme}
            className="p-2 w-10 h-10 flex items-center justify-center border border-border rounded-full hover:bg-muted transition-colors"
            title={`当前主题: ${currentTheme.label}`}
        >
            {currentTheme.icon}
        </button>
    );
}
