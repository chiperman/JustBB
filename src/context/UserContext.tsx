'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/actions/auth';

export interface UserInfo {
    id: string;
    email?: string;
    created_at: string;
    role?: string;
}

interface UserContextType {
    user: UserInfo | null;
    isAdmin: boolean;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        setLoading(true);
        try {
            const u = await getCurrentUser();
            setUser(u as UserInfo | null);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const isAdmin = user?.role === 'admin';

    return (
        <UserContext.Provider value={{ user, isAdmin, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
