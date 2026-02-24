'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Menu01Icon as Menu, Cancel01Icon as X } from '@hugeicons/core-free-icons';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface MobileMenuButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

import { Button } from '@/components/ui/button';

export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
    return (
        <Button
            variant="outline"
            size="icon"
            onClick={onClick}
            className="lg:hidden fixed top-4 left-4 z-50 rounded-xl shadow-sm h-10 w-10 p-0"
            aria-label={isOpen ? '关闭菜单' : '打开菜单'}
        >
            {isOpen ? (
                <HugeiconsIcon icon={X} size={20} aria-hidden="true" />
            ) : (
                <HugeiconsIcon icon={Menu} size={20} aria-hidden="true" />
            )}
        </Button>
    );
}

interface MobileMenuOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function MobileMenuOverlay({ isOpen, onClose, children }: MobileMenuOverlayProps) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* 侧边栏始终保持挂载，仅通过位移控制隐藏 */}
            <motion.div
                initial={false}
                animate={{
                    x: isOpen ? 0 : '-100%',
                    visibility: (isOpen ? 'visible' : 'hidden') as 'visible' | 'hidden'
                }}
                transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
                className="lg:hidden fixed left-0 top-0 h-full w-72 z-50 bg-background shadow-xl pointer-events-auto"
                style={{
                    pointerEvents: isOpen ? 'auto' : 'none'
                }}
                role="dialog"
                aria-modal="true"
                aria-label="移动端菜单"
            >
                {children}
            </motion.div>
        </>
    );
}

export function useMobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);
    const close = () => setIsOpen(false);
    const open = () => setIsOpen(true);

    return { isOpen, toggle, close, open };
}
