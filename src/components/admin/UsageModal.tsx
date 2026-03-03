"use client";

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { HugeiconsIcon } from '@hugeicons/react';
import {
    Database01Icon,
    UserGroupIcon,
    GlobalIcon,
    FlashIcon,
    ApiIcon,
    CheckListIcon,
    RotateRight01Icon as RefreshIcon,
    Cancel01Icon as CloseIcon,
} from '@hugeicons/core-free-icons';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UsageProgress } from "./UsageProgress";
import { getSupabaseUsageStats } from "@/actions/usage";
import { motion, AnimatePresence } from 'framer-motion';
import { DialogClose } from "@/components/ui/dialog";

interface UsageModalProps {
    trigger: React.ReactNode;
}

interface UsageData {
    db: { used: number; limit: number; percentage: number; unit: string };
    storage: { used: number; limit: number; percentage: number; unit: string };
    mau: { used: number; limit: number; percentage: number };
    egress: { used: number; limit: number; percentage: number; unit: string };
    realtime: { connections: number; messages: number };
    functions: { invocations: number };
}

interface SuccessStats {
    success: true;
    isFullIndicator: boolean;
    data: UsageData;
}

export function UsageModal({ trigger }: UsageModalProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [stats, setStats] = React.useState<SuccessStats | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getSupabaseUsageStats();
            if (result.success && result.data) {
                setStats(result as SuccessStats);
            } else {
                setError(result.error || "获取数据失败");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "未知错误");
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
            <DialogContent className="max-w-md bg-white border-none p-0 overflow-hidden shadow-2xl rounded-3xl [&>button]:hidden">
                <div className="flex flex-col h-full bg-[#fcfcfc]">
                    <div className="p-6 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100/50 p-2.5 rounded-2xl">
                                <HugeiconsIcon icon={Database01Icon} size={22} className="text-orange-600/80" />
                            </div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900">Supabase 用量</DialogTitle>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl border-gray-100 bg-white hover:bg-gray-50 transition-all active:scale-95 shadow-none group"
                                    onClick={fetchData}
                                    disabled={loading}
                                    title="刷新数据"
                                >
                                    <HugeiconsIcon
                                        icon={RefreshIcon}
                                        size={14}
                                        className={cn("text-gray-500 group-hover:text-gray-900", loading && "animate-spin")}
                                    />
                                </Button>
                            </div>
                        </div>
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                            >
                                <HugeiconsIcon icon={CloseIcon} size={18} />
                            </Button>
                        </DialogClose>
                    </div>

                    <div className="px-6 pb-8 space-y-7 overflow-y-auto max-h-[70vh] custom-scrollbar">
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
                                    className="space-y-7"
                                >
                                    {/* Status Badge - Image Style */}
                                    <div className="flex items-center justify-between bg-orange-50/40 p-4 rounded-[20px] border border-orange-100/50">
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn("w-2 h-2 rounded-full", stats.isFullIndicator ? "bg-green-500" : "bg-orange-400")} />
                                            <span className="text-sm font-medium text-gray-600">数据源模式</span>
                                        </div>
                                        <span className={cn(
                                            "text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl border shadow-sm",
                                            stats.isFullIndicator
                                                ? "bg-green-50 text-green-600 border-green-100"
                                                : "bg-[#FFF4E5] text-[#D97706] border-[#FDBA74]/30"
                                        )}>
                                            {stats.isFullIndicator ? "Management API (全量)" : "SQL Fallback (基础)"}
                                        </span>
                                    </div>

                                    {/* Metrics Groups */}
                                    <div className="space-y-8">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                                                <HugeiconsIcon icon={Database01Icon} size={14} />
                                                <span>存储与数据库</span>
                                            </div>
                                            <div className="grid gap-2">
                                                <UsageProgress
                                                    label="数据库大小"
                                                    used={stats.data.db.used}
                                                    limit={stats.data.db.limit}
                                                    percentage={stats.data.db.percentage}
                                                    unit="MB"
                                                />
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                                                <HugeiconsIcon icon={GlobalIcon} size={14} />
                                                <span>流量统计</span>
                                            </div>
                                            <div className="grid gap-2">
                                                <UsageProgress
                                                    label="网络流出 (Egress)"
                                                    used={stats.data.egress.used}
                                                    limit={stats.data.egress.limit}
                                                    percentage={stats.data.egress.percentage}
                                                    unit="GB"
                                                />
                                            </div>
                                        </section>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    <div className="p-6 py-5 bg-white border-t border-gray-100">
                        <div className="flex items-start gap-2.5 text-[11px] text-gray-400 leading-relaxed font-medium">
                            <div className="bg-gray-100 p-1 rounded-md mt-0.5">
                                <HugeiconsIcon icon={ApiIcon} size={10} className="text-gray-400" />
                            </div>
                            <p>
                                数据{loading ? "更新中..." : "每分钟同步一次"}。配额基于 Supabase 免费层级 (Free Plan) 标准。
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
