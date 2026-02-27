'use client';

import * as React from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, animate } from 'framer-motion';
import { Dialog, DialogTrigger, DialogPortal } from './dialog';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import Image from 'next/image';

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
    // 基础运动值：x, y 平移 - 直接使用 MotionValue 以获得极致跟手感
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // 缩放运动值：无级调节
    const rawScale = useMotionValue(1);
    const scale = useSpring(rawScale, { stiffness: 350, damping: 35 });

    const [isDragging, setIsDragging] = React.useState(false);
    const [currentScale, setCurrentScale] = React.useState(1);
    const isResettingRef = React.useRef(false);
    const [viewport, setViewport] = React.useState({ width: 1000, height: 1000 });

    // 初始化视口大小
    React.useEffect(() => {
        setViewport({ width: window.innerWidth, height: window.innerHeight });
        const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 监听 scale 变化，用于逻辑判断
    React.useEffect(() => {
        return scale.on('change', (v) => {
            setCurrentScale(v);

            // 当缩放回到 1.0 附近且不在重置中时，触发复位动画
            if (v <= 1.01 && !isResettingRef.current && (Math.abs(x.get()) > 1 || Math.abs(y.get()) > 1)) {
                isResettingRef.current = true;

                // 使用更具阻尼感的 spring 配置，彻底消除“闪过头”
                const springConfig = {
                    type: 'spring' as const,
                    stiffness: 260,
                    damping: 35, // 增加阻尼
                    restDelta: 0.5
                };

                animate(x, 0, springConfig);
                animate(y, 0, springConfig);
            }
            // 如果又放大了，解锁状态位
            else if (v > 1.1) {
                isResettingRef.current = false;
            }
        });
    }, [scale, x, y]);

    // 滚轮缩放处理
    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = -e.deltaY;
        const factor = 0.002; // 缩放灵敏度
        let nextScale = rawScale.get() + delta * factor;

        // 限制缩放范围 [1.0, 3.0]
        nextScale = Math.min(Math.max(nextScale, 1), 3);
        rawScale.set(nextScale);
    };

    // 统一点击处理：无论缩放与否，点击均关闭（最快交互路径）
    const handleBackgroundClick = () => {
        if (isDragging) return;
        onClose();
    };
    // 根据缩放倍数动态计算约束范围，避免使用硬编码数值，防止高倍下找不回图片
    const dragConstraints = {
        top: -viewport.height * currentScale * 0.35,
        bottom: viewport.height * currentScale * 0.35,
        left: -viewport.width * currentScale * 0.2, // 收紧横向约束，防止宽屏丢失
        right: viewport.width * currentScale * 0.2
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
        >
            {/* 背景遮罩 */}
            <motion.div
                initial={false}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-xl"
                onClick={handleBackgroundClick}
            />

            {/* 稳定布局容器 */}
            <motion.div
                className="relative z-10 w-[95vw] h-[90vh] flex items-center justify-center pointer-events-none"
            >
                {/* 缩放与平移层 */}
                <motion.div
                    className="relative flex items-center justify-center pointer-events-auto cursor-grab active:cursor-grabbing"
                    style={{ x, y, scale }}
                    drag
                    dragConstraints={dragConstraints}
                    dragElastic={0.1}
                    onDragStart={() => {
                        setIsDragging(true);
                        isResettingRef.current = false; // 拖拽开始时立即释放锁，允许下次缩回时重置
                        x.stop(); // 停止当前正在进行的动画
                        y.stop();
                    }}
                    onDragEnd={() => {
                        setTimeout(() => setIsDragging(false), 100);
                    }}
                >
                    <div
                        className={cn(
                            "relative w-full h-full max-w-[95vw] max-h-[90vh] rounded-[2px] overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)]",
                        )}
                    >
                        <Image
                            src={src}
                            alt={alt || "大图"}
                            fill
                            className="object-contain"
                            draggable={false}
                            priority
                            unoptimized={src.startsWith('data:')}
                        />
                    </div>
                </motion.div>
            </motion.div>

            {/* 交互提示 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 text-white/80 text-[10px] uppercase tracking-[0.25em] font-bold pointer-events-none whitespace-nowrap shadow-xl z-20 flex items-center gap-3"
            >
                <span className="text-primary font-mono text-xs bg-primary/20 px-2 py-0.5 rounded-full ring-1 ring-primary/30">
                    {Math.round(currentScale * 100)}%
                </span>
                <span>滚轮缩放 • 拖拽平移 • 点击背景关闭</span>
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
                className="absolute top-8 right-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95 shadow-xl backdrop-blur-md group/close z-20 cursor-pointer"
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
                        <div className="relative aspect-square w-full">
                            <Image
                                src={src}
                                alt={alt || "图片预览"}
                                fill
                                className="object-cover"
                            />
                        </div>
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
