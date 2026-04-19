'use client';

import { useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';
import { useUser } from '@/context/UserContext';

const springConfig = {
    stiffness: 350,
    damping: 35,
    mass: 1
};
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

    // 计算当前索引 (渲染期间计算)
    const currentIndex = useMemo(() => {
        const idx = navItems.findIndex(item =>
            item.href === '/' ? currentView === '/' : currentView.startsWith(item.href)
        );
        return idx !== -1 ? idx : 0;
    }, [navItems, currentView]);

    const initialY = currentIndex * 40 + 8;
    const y = useMotionValue(initialY);
    
    // 同步 y 值到当前索引，通过 Effect 异步触发以避免渲染期副作用级联
    useEffect(() => {
        y.set(currentIndex * 40 + 8);
    }, [currentIndex, y]);

    const springY = useSpring(y, springConfig);
    const velocity = useVelocity(springY);
    const scaleY = useTransform(velocity, [-1200, 0, 1200], [1.3, 1, 1.3]);
    const scaleX = useTransform(velocity, [-1200, 0, 1200], [0.9, 1, 0.9]);

    const handleNavigate = (href: string, isMobile: boolean, onClose?: () => void) => {
        if (href !== currentView) {
            router.push(href);
        }
        if (isMobile) onClose?.();
    };

    return {
        navItems,
        currentIndex,
        currentView,
        springY,
        scaleY,
        scaleX,
        handleNavigate
    };
}
