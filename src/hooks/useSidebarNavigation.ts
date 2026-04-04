'use client';

import { useMemo } from 'react';
import { useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';
import { useView } from '@/context/ViewContext';
import { useUser } from '@/context/UserContext';

const springConfig = {
    stiffness: 350,
    damping: 35,
    mass: 1
};
import { NAVIGATION_CONFIG } from '@/config/navigation';

export function useSidebarNavigation() {
    const { currentView, navigate } = useView();
    const { isAdmin } = useUser();

    const navItems = useMemo(() => {
        return NAVIGATION_CONFIG.filter(item => !item.isAdminOnly || isAdmin);
    }, [isAdmin]);

    // 计算当前索引 (渲染期间计算)
    const currentIndex = useMemo(() => {
        const idx = navItems.findIndex(item =>
            item.href === '/' ? currentView === '/' : currentView.startsWith(item.href)
        );
        return idx !== -1 ? idx : 0;
    }, [navItems, currentView]);

    const initialY = currentIndex * 40 + 8;
    const y = useMotionValue(initialY);
    
    // 同步 y 值到当前索引，直接在渲染期间设置以避免 Effect 级联
    y.set(currentIndex * 40 + 8);

    const springY = useSpring(y, springConfig);
    const velocity = useVelocity(springY);
    const scaleY = useTransform(velocity, [-1200, 0, 1200], [1.3, 1, 1.3]);
    const scaleX = useTransform(velocity, [-1200, 0, 1200], [0.9, 1, 0.9]);

    const handleNavigate = (href: string, isMobile: boolean, onClose?: () => void) => {
        navigate(href);
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
