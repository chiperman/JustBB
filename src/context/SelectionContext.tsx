'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useView } from '@/context/ViewContext';

interface SelectionContextType {
    isSelectionMode: boolean;
    selectedIds: Set<string>;
    toggleSelectionMode: (enabled?: boolean) => void;
    toggleId: (id: string) => void;
    clearSelection: () => void;
    selectAll: (ids: string[]) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const { currentView } = useView();

    // Reset selection mode when navigation occurs (except for trash page where it's always on)
    useEffect(() => {
        if (currentView === '/trash') {
            setIsSelectionMode(true);
        } else {
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        }
    }, [currentView]);

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
        <SelectionContext.Provider
            value={{
                isSelectionMode,
                selectedIds,
                toggleSelectionMode,
                toggleId,
                clearSelection,
                selectAll
            }}
        >
            {children}
        </SelectionContext.Provider>
    );
}

export function useSelection() {
    const context = useContext(SelectionContext);
    if (!context) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
}
