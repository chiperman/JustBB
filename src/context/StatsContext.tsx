'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { getMemoStats } from '@/actions/memos/analytics';
import { HeatmapStats } from '@/types/stats';

interface StatsContextType {
    stats: HeatmapStats;
    isLoading: boolean;
    isMounted: boolean;
    refreshStats: () => Promise<void>;
}

const defaultStats: HeatmapStats = {
    totalMemos: 0,
    totalTags: 0,
    firstMemoDate: null,
    days: {}
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({
    children,
    initialData
}: {
    children: React.ReactNode;
    initialData?: HeatmapStats | null;
}) {
    const [stats, setStats] = useState<HeatmapStats>(initialData || defaultStats);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [isMounted, setIsMounted] = useState(false);

    const refreshStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getMemoStats();
            if (res.success && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Failed to refresh stats:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        // 如果没有初始数据，挂载后立即抓取一次
        if (!initialData) {
            refreshStats();
        }
    }, [initialData, refreshStats]);

    const contextValue = useMemo(() => ({ 
        stats, 
        isLoading, 
        isMounted, 
        refreshStats 
    }), [stats, isLoading, isMounted, refreshStats]);

    return (
        <StatsContext.Provider value={contextValue}>
            {children}
        </StatsContext.Provider>
    );
}

export function useStats() {
    const context = useContext(StatsContext);
    if (context === undefined) {
        throw new Error('useStats must be used within a StatsProvider');
    }
    return context;
}
