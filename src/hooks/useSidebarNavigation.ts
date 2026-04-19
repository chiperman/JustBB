'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { NAVIGATION_CONFIG } from '@/config/navigation';

export function useSidebarNavigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { isAdmin, user } = useUser();
    const currentView = pathname || '/';

    const navItems = useMemo(() => {
        return NAVIGATION_CONFIG.filter(item => {
            if (item.isAdminOnly && !isAdmin) return false;
            if (item.requiresAuth && !user) return false;
            return true;
        });
    }, [isAdmin, user]);

    const handleNavigate = (href: string, isMobile: boolean, onClose?: () => void) => {
        if (href !== currentView) {
            router.push(href);
        }
        if (isMobile) onClose?.();
    };

    return {
        navItems,
        currentView,
        handleNavigate
    };
}
