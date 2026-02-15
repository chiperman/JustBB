'use client';

import React, { createContext, useContext, useState } from 'react';

type ViewMode = 'HOME_FOCUS' | 'CARD_VIEW' | 'SPLIT_VIEW';

interface LoginModeContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const LoginModeContext = createContext<LoginModeContextType | undefined>(undefined);

export function LoginModeProvider({ children }: { children: React.ReactNode }) {
    const [viewMode, setViewMode] = useState<ViewMode>('HOME_FOCUS');

    return (
        <LoginModeContext.Provider value={{ viewMode, setViewMode }}>
            {children}
        </LoginModeContext.Provider>
    );
}

export function useLoginMode() {
    const context = useContext(LoginModeContext);
    if (context === undefined) {
        throw new Error('useLoginMode must be used within a LoginModeProvider');
    }
    return context;
}
