'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home01Icon } from '@hugeicons/core-free-icons';

import { cn } from '@/lib/utils';

interface ContextPageShellProps {
    header: ReactNode;
    children: ReactNode;
    maxWidthClassName?: string;
    contentClassName?: string;
}

interface ContextPageHeaderProps {
    icon: ComponentProps<typeof HugeiconsIcon>['icon'];
    title: string;
    description?: ReactNode;
    breadcrumbLabel?: string;
    actions?: ReactNode;
    meta?: ReactNode;
    className?: string;
}

interface ContextPageStatProps {
    label: string;
    value: string;
    hint?: string;
    className?: string;
}

export function ContextPageShell({
    header,
    children,
    maxWidthClassName = 'max-w-screen-md',
    contentClassName,
}: ContextPageShellProps) {
    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <div className="flex-none border-b border-border/50 bg-background/85 backdrop-blur-md">
                <div className={cn('mx-auto w-full px-6 py-6', maxWidthClassName)}>
                    {header}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-stable">
                <div className={cn('mx-auto w-full px-6 pb-20 pt-8', maxWidthClassName, contentClassName)}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ContextPageHeader({
    icon,
    title,
    description,
    breadcrumbLabel,
    actions,
    meta,
    className,
}: ContextPageHeaderProps) {
    const crumb = breadcrumbLabel ?? title;

    return (
        <header className={cn('space-y-4', className)}>
            <div className="flex items-center justify-between gap-3">
                <Link
                    href="/"
                    className="group flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent"
                >
                    <HugeiconsIcon
                        icon={Home01Icon}
                        size={14}
                        className="text-primary/70 transition-colors group-hover:text-primary"
                    />
                    <span className="font-semibold tracking-tight text-primary/90 transition-colors group-hover:text-primary">
                        JustMemo
                    </span>
                    <span className="text-muted-foreground/30">/</span>
                    <span className="truncate text-muted-foreground transition-colors group-hover:text-foreground">
                        {crumb}
                    </span>
                </Link>

                {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/60 px-5 py-5 shadow-sm sm:px-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            <HugeiconsIcon icon={icon} size={14} className="text-primary/70" />
                            <span>{crumb}</span>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                {title}
                            </h1>
                            {description ? (
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {meta ? (
                        <div className="flex flex-wrap gap-2 sm:max-w-[320px] sm:justify-end">
                            {meta}
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}

export function ContextPageStat({
    label,
    value,
    hint,
    className,
}: ContextPageStatProps) {
    return (
        <div className={cn('min-w-[96px] rounded-xl border border-border/60 bg-background/80 px-3 py-2', className)}>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                {label}
            </div>
            <div className="mt-1 text-sm font-medium tracking-tight text-foreground">
                {value}
            </div>
            {hint ? (
                <div className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    {hint}
                </div>
            ) : null}
        </div>
    );
}
