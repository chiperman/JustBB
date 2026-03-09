'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useView } from './ViewContext';

interface SelectionContextType {
    isSelectionMode: boolean;
    selectedIds: Set<string>;
    toggleSelectionMode: (enabled?: boolean) => void;
    toggleId: (id: string) => void;
    clearSelection: () => void;
    selectAll: (ids: string[]) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const { currentView } = useView();

    // --- Selection State ---
    const [isSelectionMode, setIsSelectionMode] = useState(currentView === '/trash');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    /**
     * React 18 推荐模式：渲染期间同步更新状态
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

    const contextValue = useMemo(() => ({
        isSelectionMode,
        selectedIds,
        toggleSelectionMode,
        toggleId,
        clearSelection,
        selectAll
    }), [isSelectionMode, selectedIds, toggleSelectionMode, toggleId, clearSelection, selectAll]);

    return (
        <SelectionContext.Provider value={contextValue}>
            {children}
        </SelectionContext.Provider>
    );
}

export function useUI() {
    const context = useContext(SelectionContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a SelectionProvider (UIProvider)');
    }
    return context;
}

export const useSelection = useUI;
