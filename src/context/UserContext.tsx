'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCurrentUser } from '@/features/auth/actions';

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
    isMounted: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'justbb_user_info';

export function UserProvider({ children, initialUser = null }: { children: React.ReactNode; initialUser?: UserInfo | null }) {
    const [user, setUser] = useState<UserInfo | null>(initialUser);
    const [loading, setLoading] = useState(false); // 初始 loading 设为 false，因为我们可能有 initialUser
    const [isMounted, setIsMounted] = useState(false);

    const refreshUser = useCallback(async () => {
        setLoading(true);
        try {
            const u = await getCurrentUser();
            const userInfo = u as UserInfo | null;
            setUser(userInfo);
            if (userInfo) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setUser(null);
            localStorage.removeItem(STORAGE_KEY);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        // 如果没有提供初始用户数据，挂载后立即刷新一次确认状态
        if (initialUser === undefined) {
            refreshUser();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshUser]); // 移除 initialUser 依赖，防止服务端 layout 刷新导致对象引用变动触发循环

    const isAdmin = user?.role === 'admin';

    const value = useMemo(() => ({ 
        user, 
        isAdmin, 
        loading, 
        isMounted, 
        refreshUser 
    }), [user, isAdmin, loading, isMounted, refreshUser]);

    return (
        <UserContext.Provider value={value}>
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
