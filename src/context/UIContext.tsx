'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useView } from './ViewContext';

type ViewMode = 'HOME_FOCUS' | 'CARD_VIEW' | 'SPLIT_VIEW';

interface UIContextType {
    // --- View State ---
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    isManualClick: boolean;
    setManualClick: (val: boolean) => void;

    // --- Selection State ---
    isSelectionMode: boolean;
    selectedIds: Set<string>;
    toggleSelectionMode: (enabled?: boolean) => void;
    toggleId: (id: string) => void;
    clearSelection: () => void;
    selectAll: (ids: string[]) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const { currentView } = useView();

    // --- View State ---
    const [viewMode, setViewMode] = useState<ViewMode>('HOME_FOCUS');
    const [activeId, setActiveIdState] = useState<string | null>(null);
    const [isManualClick, setIsManualClick] = useState(false);
    const manualClickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- Selection State ---
    const [isSelectionMode, setIsSelectionMode] = useState(currentView === '/trash');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    /**
     * React 18 推荐模式：渲染期间同步更新状态
     * 避免在 useEffect 中同步调用 setState 以减少渲染瀑布
     */
    const [prevView, setPrevView] = useState(currentView);
    if (prevView !== currentView) {
        setPrevView(currentView);
        if (currentView === '/trash') {
            setIsSelectionMode(true);
        } else {
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    }

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

    const toggleSelectionMode = useCallback((enabled?: boolean) => {
        setIsSelectionMode(prev => {
            const next = enabled !== undefined ? enabled : !prev;
            if (!next) {
                setSelectedIds(new Set());
            }
            return next;
        });
    }, []);

    const toggleId = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    return (
        <UIContext.Provider value={{
            viewMode,
            setViewMode,
            activeId,
            setActiveId,
            isManualClick,
            setManualClick,
            isSelectionMode,
            selectedIds,
            toggleSelectionMode,
            toggleId,
            clearSelection,
            selectAll
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

// Backward compatibility alias for selection
export const useSelection = useUI;
