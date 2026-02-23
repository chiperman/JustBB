'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Dialog, DialogTrigger, DialogPortal } from './dialog';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

interface ImageZoomProps {
    src: string;
    alt?: string;
    className?: string;
    children?: React.ReactNode;
}

/**
 * 独立的预览内容组件
 * 每次通过 key 重新挂载，确保 useMotionValue/useSpring 彻底重置
 */
function PreviewContent({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
    const [isZoomed, setIsZoomed] = React.useState(false);
    const [isDragging, setIsDragging] = React.useState(false);

    // 每次挂载都是全新的 motion values，无残留
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 400, damping: 40 });
    const springY = useSpring(y, { stiffness: 400, damping: 40 });

    const toggleZoom = (e: React.MouseEvent) => {
        if (isDragging) return;
        e.stopPropagation();
        if (isZoomed) {
            x.set(0);
            y.set(0);
        }
        setIsZoomed(!isZoomed);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
            {/* 背景遮罩 - 直接显示，关闭时淡出 */}
            <motion.div
                initial={false}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* 稳定布局容器 */}
            <motion.div
                className="relative z-10 w-[95vw] h-[90vh] flex items-center justify-center pointer-events-none"
            >
                {/* 缩放与平移层 */}
                <motion.div
                    className={cn(
                        "relative flex items-center justify-center pointer-events-auto",
                        isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                    )}
                    style={{ x: springX, y: springY }}
                    drag={isZoomed}
                    dragConstraints={{ top: -800, bottom: 800, left: -800, right: 800 }}
                    dragElastic={0.1}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => {
                        setTimeout(() => setIsDragging(false), 100);
                    }}
                    onClick={toggleZoom}
                >
                    <motion.img
                        src={src}
                        alt={alt || "大图"}
                        initial={false}
                        animate={{
                            scale: isZoomed ? 1.6 : 1,
                        }}
                        style={{
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.4)"
                        }}
                        transition={{
                            scale: {
                                duration: 0.4,
                                ease: [0.16, 1, 0.3, 1]
                            }
                        }}
                        className={cn(
                            "block w-full h-full max-w-[95vw] max-h-[90vh] object-contain rounded-[2px]",
                        )}
                        draggable={false}
                    />
                </motion.div>
            </motion.div>

            {/* 交互提示 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 text-white/80 text-[10px] uppercase tracking-[0.25em] font-bold pointer-events-none whitespace-nowrap shadow-2xl z-20"
            >
                {isZoomed ? '点击缩小 • 拖拽平移' : '点击放大 • 点击背景关闭'}
            </motion.div>

            {/* 关闭按钮 */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: 0.2,
                    ease: "easeOut",
                    delay: 0.05
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-8 right-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95 shadow-2xl backdrop-blur-md group/close z-20 cursor-pointer"
                aria-label="关闭预览"
            >
                <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={22}
                    strokeWidth={2}
                    className="group-hover/close:rotate-90 transition-transform duration-300"
                />
            </motion.button>
        </div>
    );
}

export function ImageZoom({ src, alt, className, children }: ImageZoomProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [openCount, setOpenCount] = React.useState(0);

    const handleClose = () => setIsOpen(false);

    const handleOpen = () => {
        setOpenCount(c => c + 1);
        setIsOpen(true);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
            else handleOpen();
        }}>
            <DialogTrigger asChild>
                <motion.div
                    whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.985 }}
                    className={cn("cursor-zoom-in group/zoom relative overflow-hidden rounded-inner shadow-sm ring-1 ring-black/5", className)}
                >
                    {children || (
                        <img
                            src={src}
                            alt={alt || "图片预览"}
                            className="w-full h-auto object-cover"
                        />
                    )}
                </motion.div>
            </DialogTrigger>

            <DialogPortal>
                <AnimatePresence mode="wait">
                    {isOpen && (
                        <PreviewContent
                            key={openCount}
                            src={src}
                            alt={alt}
                            onClose={handleClose}
                        />
                    )}
                </AnimatePresence>
            </DialogPortal>
        </Dialog>
    );
}
