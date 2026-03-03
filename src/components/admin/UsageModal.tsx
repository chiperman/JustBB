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
    ReloadIcon,
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

        // 保证加载动画至少显示 800ms，提升视觉体感
        const startTime = Date.now();
        const MIN_LOADING_TIME = 800;

        try {
            const result = await getSupabaseUsageStats();

            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < MIN_LOADING_TIME) {
                await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsedTime));
            }

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
                    <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <HugeiconsIcon icon={FlashIcon} size={20} className="text-primary" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-gray-800 tracking-tight">
                                Supabase 用量
                            </DialogTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setLoading(true);
                                    setStats(null);
                                    fetchData().then(() => setLoading(false));
                                }}
                                className="h-7 w-7 rounded-md text-gray-400 hover:text-primary hover:bg-accent transition-all active:scale-95 shadow-none"
                                disabled={loading}
                            >
                                <HugeiconsIcon
                                    icon={ReloadIcon}
                                    size={14}
                                    className={cn(loading && "animate-spin")}
                                />
                            </Button>
                        </div>

                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
                            >
                                <HugeiconsIcon icon={CloseIcon} size={16} />
                            </Button>
                        </DialogClose>
                    </DialogHeader>

                    <div className="px-6 pt-6 pb-6 flex flex-col overflow-y-auto max-h-[70vh] min-h-[356px] custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {loading && !stats ? (
                                <motion.div
                                    key="loading"
                                    className="flex-1 flex flex-col items-center justify-center py-10 space-y-4"
                                >
                                    <div className="bg-orange-50/50 p-6 rounded-card">
                                        <HugeiconsIcon
                                            icon={ReloadIcon}
                                            size={32}
                                            className="text-orange-500 animate-spin"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">正在同步云端配额...</p>
                                </motion.div>
                            ) : error ? (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-8 text-center space-y-4"
                                >
                                    <div className="bg-red-500/10 p-4 rounded-card inline-block">
                                        <HugeiconsIcon icon={ApiIcon} size={32} className="text-red-500" />
                                    </div>
                                    <p className="text-sm text-red-500 font-medium px-4">{error}</p>
                                    <Button onClick={fetchData} variant="outline" size="sm" className="rounded-md active:scale-95 shadow-sm">重试</Button>
                                </motion.div>
                            ) : stats ? (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Status Badge - Image Style */}
                                    <div className="flex items-center justify-between bg-orange-50/40 p-4 rounded-card border border-orange-100/50">
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn("w-2 h-2 rounded-full", stats.isFullIndicator ? "bg-green-500" : "bg-orange-400")} />
                                            <span className="text-sm font-medium text-gray-600">数据源模式</span>
                                        </div>
                                        <span className={cn(
                                            "text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border shadow-none",
                                            stats.isFullIndicator
                                                ? "bg-green-50 text-green-600 border-green-100"
                                                : "bg-[#FFF4E5] text-[#D97706] border-[#FDBA74]/30"
                                        )}>
                                            {stats.isFullIndicator ? "Management API (全量)" : "SQL Fallback (基础)"}
                                        </span>
                                    </div>

                                    {/* Metrics Groups */}
                                    <div className="space-y-6">
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
                        <div className="flex items-center gap-2.5 text-[11px] text-gray-400 leading-relaxed font-medium">
                            <div className="bg-gray-100 p-1 rounded-md">
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
