'use client';

import { ThemeToggle } from '../ui/ThemeToggle';
import { FontToggle } from '../ui/FontToggle';
import { Home, Tag, Trash2, Settings, Image as GalleryIcon } from 'lucide-react';
import Link from 'next/link';

export function LeftSidebar() {
    const navItems = [
        { icon: <Home className="w-5 h-5" />, label: '流信息', href: '/' },
        { icon: <GalleryIcon className="w-5 h-5" />, label: '画廊', href: '/gallery' },
        { icon: <Tag className="w-5 h-5" />, label: '标签', href: '/tags' },
        { icon: <Trash2 className="w-5 h-5" />, label: '垃圾箱', href: '/trash' },
    ];

    return (
        <aside className="w-64 h-screen sticky top-0 flex flex-col p-6 border-r border-border bg-background/50 backdrop-blur-md">
            <div className="mb-10">
                <h1 className="text-2xl font-bold tracking-tight text-primary">JustMemo</h1>
                <p className="text-xs text-muted-foreground mt-1 font-sans">FRAGMENTED MEMORY</p>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-all group"
                    >
                        <span className="text-muted-foreground group-hover:text-primary transition-colors">
                            {item.icon}
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-border space-y-4">
                <div className="flex items-center justify-between px-2">
                    <ThemeToggle />
                    <FontToggle />
                </div>
                <Link
                    href="/admin"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-all group"
                >
                    <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    <span className="text-sm font-medium">系统配置</span>
                </Link>
            </div>
        </aside>
    );
}
