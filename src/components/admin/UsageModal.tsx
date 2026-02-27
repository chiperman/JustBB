"use client";

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Cancel01Icon as X,
    RotateLeft01Icon as RefreshIcon,
    Database01Icon,
    AiCloud01Icon,
    UserGroupIcon,
    GlobalIcon,
    FlashIcon,
    ApiIcon,
    CheckListIcon
} from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UsageProgress } from "./UsageProgress";
import { getSupabaseUsageStats } from "@/actions/usage";
import { motion, AnimatePresence } from 'framer-motion';

interface UsageModalProps {
    trigger: React.ReactNode;
}

export function UsageModal({ trigger }: UsageModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [stats, setStats] = React.useState<any>(null);
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getSupabaseUsageStats();
            if (result.success) {
                setStats(result);
            } else {
                setError(result.error || "获取数据失败");
            }
        } catch (err: any) {
            setError(err.message || "未知错误");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (isOpen && !stats) {
            fetchData();
        }
    }, [isOpen, stats, fetchData]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-md bg-background border-none p-0 overflow-hidden shadow-2xl rounded-3xl">
                <div className="flex flex-col h-full bg-gradient-to-b from-muted/30 to-background">
                    <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <HugeiconsIcon icon={Database01Icon} size={20} className="text-primary" />
                            </div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Supabase 用量</DialogTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                                onClick={fetchData}
                                disabled={loading}
                            >
                                <HugeiconsIcon
                                    icon={RefreshIcon}
                                    size={18}
                                    className={cn(loading && "animate-spin")}
                                />
                            </Button>
                            <DialogClose asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/5">
                                    <HugeiconsIcon icon={X} size={18} />
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogHeader>

                    <div className="px-6 pb-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {loading && !stats ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-12 flex flex-col items-center justify-center space-y-4"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                        <div className="relative bg-primary/10 p-4 rounded-full">
                                            <HugeiconsIcon icon={RefreshIcon} size={32} className="animate-spin text-primary" />
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium animate-pulse">正在同步云端配额...</p>
                                </motion.div>
                            ) : error ? (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-8 text-center space-y-4"
                                >
                                    <div className="bg-red-500/10 p-4 rounded-2xl inline-block">
                                        <HugeiconsIcon icon={ApiIcon} size={32} className="text-red-500" />
                                    </div>
                                    <p className="text-sm text-red-500 font-medium px-4">{error}</p>
                                    <Button onClick={fetchData} variant="outline" size="sm" className="rounded-full">重试</Button>
                                </motion.div>
                            ) : stats ? (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Status Badge */}
                                    <div className="flex items-center justify-between bg-muted/20 p-3 rounded-2xl border border-border/50">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full animate-pulse", stats.isFullIndicator ? "bg-green-500" : "bg-amber-500")} />
                                            <span className="text-xs font-medium text-muted-foreground">数据源模式</span>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border",
                                            stats.isFullIndicator
                                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                        )}>
                                            {stats.isFullIndicator ? "Management API (全量)" : "SQL Fallback (基础)"}
                                        </span>
                                    </div>

                                    {/* Metrics Groups */}
                                    <div className="space-y-6">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                                                <HugeiconsIcon icon={Database01Icon} size={12} />
                                                <span>存储与数据库</span>
                                            </div>
                                            <div className="grid gap-5">
                                                <UsageProgress
                                                    label="数据库大小"
                                                    used={stats.data.db.used}
                                                    limit={stats.data.db.limit}
                                                    percentage={stats.data.db.percentage}
                                                    unit="MB"
                                                />
                                                <UsageProgress
                                                    label="对象存储"
                                                    used={stats.data.storage.used}
                                                    limit={stats.data.storage.limit}
                                                    percentage={stats.data.storage.percentage}
                                                    unit="MB"
                                                />
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                                                <HugeiconsIcon icon={UserGroupIcon} size={12} />
                                                <span>访问与流量</span>
                                            </div>
                                            <div className="grid gap-5">
                                                <UsageProgress
                                                    label="月活用户 (MAU)"
                                                    used={stats.data.mau.used}
                                                    limit={stats.data.mau.limit}
                                                    percentage={stats.data.mau.percentage}
                                                />
                                                <UsageProgress
                                                    label="网络流出 (Egress)"
                                                    used={stats.data.egress.used}
                                                    limit={stats.data.egress.limit}
                                                    percentage={stats.data.egress.percentage}
                                                    unit="GB"
                                                />
                                            </div>
                                        </section>

                                        {stats.isFullIndicator && (
                                            <section className="space-y-4">
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                                                    <HugeiconsIcon icon={FlashIcon} size={12} />
                                                    <span>高级特性 (Management API 独占)</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-muted/30 p-3 rounded-2xl border border-border/50">
                                                        <div className="text-[10px] text-muted-foreground mb-1">Realtime 连接</div>
                                                        <div className="text-sm font-bold flex items-center gap-1.5">
                                                            <HugeiconsIcon icon={GlobalIcon} size={14} className="text-blue-500" />
                                                            {stats.data.realtime.connections}
                                                        </div>
                                                    </div>
                                                    <div className="bg-muted/30 p-3 rounded-2xl border border-border/50">
                                                        <div className="text-[10px] text-muted-foreground mb-1">Edge Functions</div>
                                                        <div className="text-sm font-bold flex items-center gap-1.5">
                                                            <HugeiconsIcon icon={CheckListIcon} size={14} className="text-purple-500" />
                                                            {stats.data.functions.invocations}次调用
                                                        </div>
                                                    </div>
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <div className="p-6 pt-2 bg-muted/30 border-t border-border/50 text-[10px] text-muted-foreground text-center">
                        数据每分钟同步一次。配额基于 Supabase 免费层级 (Free Plan) 标准。
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
