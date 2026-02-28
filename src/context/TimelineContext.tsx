'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface TimelineContextType {
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    isManualClick: boolean;
    setManualClick: (val: boolean) => void;
    teleportDate: string | null;
    setTeleportDate: (date: string | null) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function TimelineProvider({ children }: { children: React.ReactNode }) {
    const [activeId, setActiveIdState] = useState<string | null>(null);
    const [isManualClick, setIsManualClick] = useState(false);
    const [teleportDate, setTeleportDate] = useState<string | null>(null);
    const manualClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const setActiveId = useCallback((id: string | null) => {
        setActiveIdState(id);
    }, []);

    const setManualClick = useCallback((val: boolean) => {
        setIsManualClick(val);
        if (val) {
            if (manualClickTimeoutRef.current) clearTimeout(manualClickTimeoutRef.current);
            manualClickTimeoutRef.current = setTimeout(() => {
                setIsManualClick(false);
            }, 1000); // 1秒后恢复自动监听
        }
    }, []);

    return (
        <TimelineContext.Provider value={{
            activeId,
            setActiveId,
            isManualClick,
            setManualClick,
            teleportDate,
            setTeleportDate
        }}>
            {children}
        </TimelineContext.Provider>
    );
}

export function useTimeline() {
    const context = useContext(TimelineContext);
    if (!context) {
        // 返回一个安全的占位符，防止在导航/渲染间隙崩溃
        return {
            activeId: null,
            setActiveId: () => { },
            isManualClick: false,
            setManualClick: () => { },
            teleportDate: null,
            setTeleportDate: () => { }
        };
    }
    return context;
}
