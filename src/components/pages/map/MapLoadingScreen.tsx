'use client';

import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Location04Icon } from '@hugeicons/core-free-icons';

export function MapLoadingScreen() {
    return (
        <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
            className="absolute inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
        >
            {/* 背景网格与动态扫描线 */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0
                    [background-image:radial-gradient(ellipse_at_center,transparent_20%,hsl(var(--background))_70%),linear-gradient(to_right,hsl(var(--muted-foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground))_1px,transparent_1px)]
                    [background-size:100%_100%,40px_40px,40px_40px]
                    opacity-[0.05]"
                />
                <motion.div
                    initial={{ translateY: '-100%' }}
                    animate={{ translateY: '200%' }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-[30vh] bg-gradient-to-b from-transparent via-primary/20 to-transparent blur-2xl pointer-events-none"
                />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                <div className="relative flex items-center justify-center">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [0.8, 1.2, 3],
                                opacity: [0, 0.6, 0]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 1,
                                times: [0, 0.2, 1],
                                ease: "linear"
                            }}
                            className="absolute inset-0 rounded-full border-2 border-primary/30"
                        />
                    ))}

                    <div className="relative bg-background border border-primary/30 backdrop-blur-md p-6 rounded-full text-primary shadow-2xl flex items-center justify-center">
                        <HugeiconsIcon icon={Location04Icon} size={40} className="animate-pulse" />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
                        <span className="text-[12px] font-medium text-primary/80 tracking-widest uppercase flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Scanning Environment
                        </span>
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-medium animate-pulse">
                        正在同步空间信标数据...
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
