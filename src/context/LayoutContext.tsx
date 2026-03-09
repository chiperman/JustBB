'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

export type ViewMode = 'HOME_FOCUS' | 'CARD_VIEW' | 'SPLIT_VIEW';

interface LayoutContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    isManualClick: boolean;
    setManualClick: (val: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
    const [viewMode, setViewMode] = useState<ViewMode>('HOME_FOCUS');
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
            }, 1000);
        }
    }, []);

    const contextValue = useMemo(() => ({
        viewMode,
        setViewMode,
        activeId,
        setActiveId,
        isManualClick,
        setManualClick
    }), [viewMode, activeId, isManualClick, setActiveId, setManualClick]);

    return (
        <LayoutContext.Provider value={contextValue}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
}
