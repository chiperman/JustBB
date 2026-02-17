'use client';

import { useEffect, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { useLoginMode } from '@/context/LoginModeContext';
import { LoginPanel } from '@/components/auth/LoginPanel';

export function LoginTransitionWrapper({ children }: { children: React.ReactNode }) {
    const { viewMode, setViewMode } = useLoginMode();
    const prevViewModeRef = useRef(viewMode);

    // Automatic transition logic
    useEffect(() => {
        if (viewMode === 'CARD_VIEW') {
            const timer = setTimeout(() => {
                // If we came from HOME_FOCUS, go to SPLIT_VIEW
                if (prevViewModeRef.current === 'HOME_FOCUS') {
                    setViewMode('SPLIT_VIEW');
                }
                // If we came from SPLIT_VIEW, go to HOME_FOCUS
                else if (prevViewModeRef.current === 'SPLIT_VIEW') {
                    setViewMode('HOME_FOCUS');
                }
            }, 400); // Faster transition timer
            return () => clearTimeout(timer);
        }

        // Update the ref to the current mode AFTER checking (so it's the "previous" next time)
        prevViewModeRef.current = viewMode;
    }, [viewMode, setViewMode]);

    const homeTransitionVariants: Variants = {
        home: {
            scale: 1,
            x: '0%',
            opacity: 1,
            filter: 'blur(0px) brightness(1)',
            borderRadius: '0px',
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 26,
                mass: 1
            }
        },
        card: {
            scale: 0.9,
            x: '0%',
            opacity: 1,
            filter: 'blur(0px) brightness(1)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transition: {
                type: 'spring',
                stiffness: 260,
                damping: 26,
                mass: 1
            }
        },
        split: {
            scale: 0.9,
            x: '45%',
            opacity: 1,
            filter: 'blur(4px) brightness(0.95)',
            borderRadius: '24px',
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 24
            }
        },
        hover: {
            scale: 0.9,
            x: '45%',
            opacity: 1,
            filter: 'blur(0px) brightness(1)',
            borderRadius: '24px',
            transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] }
        }
    };

    // Text Parallax Variants
    const textVariants: Variants = {
        home: { x: 0, opacity: 0.05 },
        split: (custom) => ({
            x: custom * 50, // Parallax shift
            opacity: 0.08,
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
        })
    };

    // Mapping viewMode to variant keys
    const getVariant = () => {
        if (viewMode === 'HOME_FOCUS') return 'home';
        if (viewMode === 'CARD_VIEW') return 'card';
        return 'split';
    };

    return (
        <div className="fixed inset-0 overflow-hidden bg-[#fdfcf9] paper-texture">
            {/* Background Decorative Text */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
                <motion.span
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 0.05, x: 0 }}
                    className="absolute top-[10%] left-[5%] text-[10vw] font-editorial italic text-black dark:text-white"
                >
                    JustMemo Draft
                </motion.span>
                <motion.span
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 0.03, x: 0 }}
                    className="absolute bottom-[15%] right-[10%] text-[4vw] font-editorial text-black dark:text-white"
                >
                    with ❤️ by chiperman
                </motion.span>
            </div>

            {/* Split View Container */}
            <div className="relative w-full h-full z-10">
                {/* Home Panel (Main Content) */}
                <motion.div
                    variants={homeTransitionVariants}
                    initial="home"
                    animate={getVariant()}
                    whileHover={viewMode === 'SPLIT_VIEW' ? "hover" : undefined}
                    className={`absolute inset-0 z-10 origin-center overflow-hidden bg-background ${viewMode === 'SPLIT_VIEW' ? 'cursor-pointer' : ''}`}
                    style={{ borderRadius: viewMode === 'HOME_FOCUS' ? 0 : 24 }}
                    onClick={() => viewMode === 'SPLIT_VIEW' && setViewMode('CARD_VIEW')}
                >
                    <div className="w-full h-full shadow-2xl overflow-hidden border border-black/5 dark:border-white/5" style={{ borderRadius: 'inherit' }}>
                        {/* Actual Home Page Content */}
                        <div className={viewMode === 'SPLIT_VIEW' ? "pointer-events-none select-none h-full" : "h-full"}>
                            {children}
                        </div>


                    </div>
                </motion.div>

                {/* Login Panel (Auth Form) */}
                <LoginPanel />
            </div>
        </div>
    );
}
