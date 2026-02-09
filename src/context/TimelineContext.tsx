'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface TimelineContextType {
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    isManualClick: boolean;
    setManualClick: (val: boolean) => void;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function TimelineProvider({ children }: { children: React.ReactNode }) {
    const [activeId, setActiveIdState] = useState<string | null>(null);
    const [isManualClick, setIsManualClick] = useState(false);
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
        <TimelineContext.Provider value={{ activeId, setActiveId, isManualClick, setManualClick }}>
            {children}
        </TimelineContext.Provider>
    );
}

export function useTimeline() {
    const context = useContext(TimelineContext);
    if (!context) {
        throw new Error('useTimeline must be used within a TimelineProvider');
    }
    return context;
}
