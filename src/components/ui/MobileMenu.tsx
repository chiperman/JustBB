'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMenuButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
    return (
        <button
            onClick={onClick}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-xl shadow-lg"
            aria-label={isOpen ? '关闭菜单' : '打开菜单'}
        >
            {isOpen ? (
                <X className="w-5 h-5" />
            ) : (
                <Menu className="w-5 h-5" />
            )}
        </button>
    );
}

interface MobileMenuOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function MobileMenuOverlay({ isOpen, onClose, children }: MobileMenuOverlayProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 背景遮罩 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={onClose}
                    />
                    {/* 侧边栏 */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="lg:hidden fixed left-0 top-0 h-full w-72 z-50 bg-background shadow-xl"
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function useMobileMenu() {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);
    const close = () => setIsOpen(false);
    const open = () => setIsOpen(true);

    return { isOpen, toggle, close, open };
}
