'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserInfo, UserRole } from '@/types/auth';
import { getCurrentUser } from '@/features/auth/actions';
import { supabase } from '@/lib/supabase';

interface UserContextType {
    user: UserInfo | null;
    isAdmin: boolean;
    loading: boolean;
    isMounted: boolean;
    refreshUser: (silent?: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'justbb_user_info';

export function UserProvider({ children, initialUser = null }: { children: React.ReactNode; initialUser?: UserInfo | null }) {
    const [user, setUser] = useState<UserInfo | null>(initialUser);
    const [loading, setLoading] = useState(false); // 初始 loading 设为 false，因为我们可能有 initialUser
    const [isMounted, setIsMounted] = useState(false);

    const refreshUser = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
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
        
        // 尝试从本地缓存恢复用户信息 (仅限客户端)
        const cachedUser = localStorage.getItem(STORAGE_KEY);
        if (cachedUser && !user) {
            try {
                setUser(JSON.parse(cachedUser));
            } catch (e) {
                console.error('Failed to parse cached user:', e);
            }
        }

        // 如果没有提供初始用户数据，且本地也没缓存，挂载后立即刷新一次确认状态
        if (initialUser === undefined && !cachedUser) {
            refreshUser();
        } else if (initialUser === undefined && cachedUser) {
            // 如果有缓存，则静默刷新以确保一致性
            refreshUser(true);
        }

        // 监听实时认证状态变化 (SIGNED_IN, SIGNED_OUT, USER_UPDATED)
        // 这确保了在登录成功后，前端相关的 UI 能够立即更新，而不需要 F5 刷新
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                // 乐观更新：如果有 session，立即设置基础用户信息
                if (session?.user) {
                    const optimisticUser: UserInfo = {
                        id: session.user.id,
                        email: session.user.email,
                        created_at: session.user.created_at,
                        // 尝试从 app_metadata 获取角色，如果 Supabase JWT 包含的话
                        role: (session.user.app_metadata?.role as UserRole) || 'user'
                    };
                    setUser(optimisticUser);
                    // 然后静默刷新以确认最新角色和完整元数据
                    refreshUser(true);
                } else {
                    refreshUser();
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem(STORAGE_KEY);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
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
