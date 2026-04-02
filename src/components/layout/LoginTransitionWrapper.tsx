'use client';

import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useLayout } from '@/context/LayoutContext';
import { useUser } from '@/context/UserContext';
import { LoginPanel } from '@/features/auth/components/LoginPanel';

export function LoginTransitionWrapper({ children }: { children: React.ReactNode }) {
    const { viewMode, setViewMode } = useLayout();
    const { user, isMounted } = useUser();
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
                stiffness: 150,
                damping: 25
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
                    animate={{ 
                        opacity: (!user && viewMode === 'SPLIT_VIEW') ? 0.02 : 0.05, 
                        x: (!user && viewMode === 'SPLIT_VIEW') ? 20 : 0 
                    }}
                    className="absolute top-[10%] left-[5%] text-[10vw] font-editorial italic text-black dark:text-white"
                >
                    JustMemo Draft
                </motion.span>
                <motion.span
                    animate={{ 
                        opacity: (!user && viewMode === 'SPLIT_VIEW') ? 0.01 : 0.03, 
                        x: (!user && viewMode === 'SPLIT_VIEW') ? -20 : 0 
                    }}
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
                    style={{ 
                        borderRadius: viewMode === 'HOME_FOCUS' ? 0 : 24,
                    }}
                    onClick={() => viewMode === 'SPLIT_VIEW' && setViewMode('HOME_FOCUS')}
                >
                    <div className="w-full h-full shadow-xl overflow-hidden border border-black/5 dark:border-white/5" style={{ borderRadius: 'inherit' }}>
                        {/* Actual Home Page Content */}
                        <div className={viewMode === 'SPLIT_VIEW' ? "pointer-events-none select-none h-full" : "h-full"}>
                            {children}
                        </div>
                    </div>
                </motion.div>

                {/* Login Panel (Auth Form) - Left Panel Slide In */}
                <AnimatePresence>
                    {isMounted && !user && viewMode === 'SPLIT_VIEW' && (
                        <div className="absolute inset-0 z-50 flex items-center justify-start p-4 lg:p-12 pointer-events-none">
                            <motion.div 
                                initial={{ opacity: 0, x: -80, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, x: -80, filter: 'blur(10px)' }}
                                transition={{ 
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 30,
                                    mass: 1
                                }}
                                className="relative w-full max-w-[420px] pointer-events-auto"
                            >
                                <div className="p-8 rounded-3xl bg-white/40 backdrop-blur-md border border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
                                    <LoginPanel />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
