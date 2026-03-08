'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ViewMode = 'HOME_FOCUS' | 'CARD_VIEW' | 'SPLIT_VIEW';

interface UIContextType {
    // View Mode (from LoginModeContext)
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;

    // Timeline (from TimelineContext)
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    isManualClick: boolean;
    setManualClick: (val: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    // View Mode State
    const [viewMode, setViewMode] = useState<ViewMode>('HOME_FOCUS');

    // Timeline State
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

    return (
        <UIContext.Provider value={{
            viewMode,
            setViewMode,
            activeId,
            setActiveId,
            isManualClick,
            setManualClick
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}

// 保持向后兼容的别名（可选，推荐直接重构）
export const useLoginMode = useUI;
export const useTimeline = useUI;
