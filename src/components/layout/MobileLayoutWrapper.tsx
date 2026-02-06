'use client';

import { MobileMenuButton, MobileMenuOverlay, useMobileMenu } from '../ui/MobileMenu';
import { LeftSidebar } from './LeftSidebar';

interface MobileLayoutWrapperProps {
    children: React.ReactNode;
}

export function MobileLayoutWrapper({ children }: MobileLayoutWrapperProps) {
    const { isOpen, toggle, close } = useMobileMenu();

    return (
        <>
            {/* 移动端菜单按钮 */}
            <MobileMenuButton isOpen={isOpen} onClick={toggle} />

            {/* 移动端侧边栏覆盖层 */}
            <MobileMenuOverlay isOpen={isOpen} onClose={close}>
                <div className="h-full overflow-y-auto">
                    <LeftSidebar />
                </div>
            </MobileMenuOverlay>

            {children}
        </>
    );
}
