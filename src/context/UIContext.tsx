'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';

interface SelectionContextType {
    isSelectionMode: boolean;
    selectedIds: Set<string>;
    toggleSelectionMode: (enabled?: boolean) => void;
    toggleId: (id: string) => void;
    clearSelection: () => void;
    selectAll: (ids: string[]) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

function UIProviderBase({
    children,
    currentPathname,
}: {
    children: React.ReactNode;
    currentPathname: string;
}) {
    const isTrashPath = currentPathname === '/trash';

    // --- Selection State ---
    const [isSelectionMode, setIsSelectionMode] = useState(isTrashPath);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

function UIProviderWithRouterPath({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() || '/';
    return <UIProviderBase key={pathname} currentPathname={pathname}>{children}</UIProviderBase>;
}

export function UIProvider({
    children,
    currentPathname,
}: {
    children: React.ReactNode;
    currentPathname?: string;
}) {
    if (currentPathname !== undefined) {
        return <UIProviderBase key={currentPathname} currentPathname={currentPathname}>{children}</UIProviderBase>;
    }

    return <UIProviderWithRouterPath>{children}</UIProviderWithRouterPath>;
}

export function useUI() {
    const context = useContext(SelectionContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a SelectionProvider (UIProvider)');
    }
    return context;
}

export const useSelection = useUI;
