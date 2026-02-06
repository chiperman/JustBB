'use client';

import { Suspense } from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { FontToggle } from '../ui/FontToggle';
import { SearchInput } from '../ui/SearchInput';
import { TagCloud } from '../ui/TagCloud';
import { Heatmap } from '../ui/Heatmap';
import { OnThisDay } from '../ui/OnThisDay';
import { UserStatus } from '../ui/UserStatus';
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

            <Suspense>
                <SearchInput />
            </Suspense>

            <div className="mb-10">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 font-sans">
                    今年记录
                </h3>
                <div className="bg-muted/10 rounded-lg border border-border/50 p-2">
                    <Heatmap />
                </div>
            </div>

            <nav className="flex-1 space-y-2 mb-6">
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

            <div className="mb-6">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 font-sans flex items-center gap-2">
                    <Tag className="w-3 h-3" /> 常用标签
                </h3>
                <Suspense fallback={<div className="h-10 animate-pulse bg-muted/20 rounded-md" />}>
                    <TagCloud />
                </Suspense>
            </div>

            <OnThisDay />

            <div className="mt-auto pt-6 border-t border-border space-y-4">
                {/* 用户登录状态 */}
                <UserStatus />

                <div className="flex items-center justify-between px-2">
                    <ThemeToggle />
                    <FontToggle />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (!confirm('Download all memos as Markdown?')) return;
                            const { exportMemos } = await import('@/actions/export');
                            const data = await exportMemos('markdown');
                            const blob = new Blob([data], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `justbb_export_${new Date().toISOString().slice(0, 10)}.md`;
                            a.click();
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-all group flex-1"
                        title="Export Markdown"
                    >
                        <Settings className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm font-medium">Export</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
