'use client';

import { useEffect } from 'react';
import { useLayout } from '@/context/LayoutContext';

export function useFeedScrollSpy(memosCount: number) {
    const { setActiveId, isManualClick } = useLayout();

    useEffect(() => {
        if (isManualClick || memosCount === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const intersecting = entries.filter((e) => e.isIntersecting);
                if (intersecting.length > 0) {
                    setActiveId(intersecting[0].target.id);
                }
            },
            { rootMargin: "-80px 0px -80% 0px", threshold: 0 },
        );

        const anchors = document.querySelectorAll(
            'div[id^="date-"], div[id^="month-"], div[id^="year-"]',
        );
        
        anchors.forEach((a) => observer.observe(a));
        
        return () => observer.disconnect();
    }, [isManualClick, setActiveId, memosCount]);
}
