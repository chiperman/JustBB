'use client';

import { useMemo } from 'react';
import { useMotionValue, useSpring, useVelocity, useTransform } from 'framer-motion';
import { useView } from '@/context/ViewContext';
import { useUser } from '@/context/UserContext';
import { Home01Icon, Tag01Icon, Delete02Icon, Image01Icon as GalleryIcon, Location04Icon } from '@hugeicons/core-free-icons';

const springConfig = {
    stiffness: 350,
    damping: 35,
    mass: 1
};

export function useSidebarNavigation() {
    const { currentView, navigate } = useView();
    const { isAdmin } = useUser();

    const navItems = useMemo(() => {
        const items = [
            { id: 'home', icon: Home01Icon, label: '首页', href: '/' },
            { id: 'gallery', icon: GalleryIcon, label: '画廊', href: '/gallery' },
            { id: 'tags', icon: Tag01Icon, label: '标签', href: '/tags' },
            { id: 'map', icon: Location04Icon, label: '地图', href: '/map' },
        ];
        if (isAdmin) {
            items.push({ id: 'trash', icon: Delete02Icon, label: '回收站', href: '/trash' });
        }
        return items;
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
