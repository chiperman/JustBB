'use client';

import { motion, Variants } from 'framer-motion';
import { Memo } from '@/types/memo';

interface FeedItemWrapperProps {
    memo: Memo;
    index: number;
    prevMemo?: Memo;
    variants: Variants;
    children: React.ReactNode;
}

export function FeedItemWrapper({ memo, index, prevMemo, variants, children }: FeedItemWrapperProps) {
    const utcDate = new Date(memo.created_at);
    const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
    const currentDate = localDate.toISOString().split("T")[0];
    const currentYear = currentDate.split("-")[0];
    const currentMonth = currentDate.split("-")[1];

    let prevDateFull = null;
    if (prevMemo) {
        const prevUtcDate = new Date(prevMemo.created_at);
        const prevLocalDate = new Date(prevUtcDate.getTime() + 8 * 60 * 60 * 1000);
        prevDateFull = prevLocalDate.toISOString().split("T")[0];
    }

    const prevYear = prevDateFull ? prevDateFull.split("-")[0] : null;
    const prevMonth = prevDateFull ? prevDateFull.split("-")[1] : null;

    const isFirstOfYear = currentYear !== prevYear && !memo.is_pinned;
    const isFirstOfMonth = (currentMonth !== prevMonth || isFirstOfYear) && prevDateFull !== null && !memo.is_pinned;
    const isFirstOfDay = currentDate !== prevDateFull && !memo.is_pinned;

    return (
        <motion.div
            id={`memo-${memo.id}`}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={index % 20}
            className="break-inside-avoid relative"
        >
            {isFirstOfYear && (
                <div id={`year-${currentYear}`} className="absolute top-0 invisible" aria-hidden="true" />
            )}
            {isFirstOfMonth && (
                <div id={`month-${currentYear}-${parseInt(currentMonth)}`} className="absolute top-0 invisible" aria-hidden="true" />
            )}
            {isFirstOfDay && (
                <div id={`date-${currentDate}`} className="absolute top-0 invisible" aria-hidden="true" />
            )}
            {children}
        </motion.div>
    );
}
