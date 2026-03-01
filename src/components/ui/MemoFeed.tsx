import { useState, useEffect, useRef, useCallback } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { MemoCard } from "./MemoCard";
import { MemoCardSkeleton } from "./MemoCardSkeleton";
import { getMemos } from "@/actions/fetchMemos";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading01Icon as Loader2 } from "@hugeicons/core-free-icons";
import { Memo } from "@/types/memo";
import { useTimeline } from "@/context/TimelineContext";
import { mergeMemos } from "@/lib/streamUtils";
import { useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";

interface MemoFeedProps {
  initialMemos: Memo[];
  searchParams: {
    query?: string;
    tag?: string;
    year?: string;
    month?: string;
    date?: string;
    sort?: string;
  };
  adminCode?: string;
  isAdmin?: boolean;
  forceContextMode?: boolean;
  prevAvailableDate?: string | null;
  nextAvailableDate?: string | null;
  contextType?: "year" | "month" | "day" | null;
}

export function MemoFeed({
  initialMemos = [],
  searchParams,
  adminCode,
  isAdmin = false,
  forceContextMode = false,
  prevAvailableDate = null,
  nextAvailableDate = null,
  contextType = null,
}: MemoFeedProps) {
  const [memos, setMemos] = useState<Memo[]>(initialMemos);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  // 1. 对于普通主页流水线，如果 initialMemos >= 10，则支持更多
  // 2. 对于上下文传送模式，如果 initialMemos 恰好达到 20 条（当前获取 limit），说明同时间段内可能还有
  const [hasMoreOlder, setHasMoreOlder] = useState(
    (!searchParams.date && !forceContextMode && initialMemos.length >= 10) ||
      (forceContextMode && initialMemos.length === 20),
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const prevParamsRef = useRef(JSON.stringify(searchParams));
  const prevForceContextModeRef = useRef(forceContextMode);

  const observerTargetBottom = useRef<HTMLDivElement>(null);

  // 1. 外部状态同步
  useEffect(() => {
    const currentParamsStr = JSON.stringify(searchParams);
    const paramsChanged = currentParamsStr !== prevParamsRef.current;
    const forceModeChanged =
      forceContextMode !== prevForceContextModeRef.current;

    if (paramsChanged || forceModeChanged) {
      console.log(
        `[Feed] Syncing props. paramsChanged: ${paramsChanged}, forceModeChanged: ${forceModeChanged}`,
      );
      prevParamsRef.current = currentParamsStr;
      prevForceContextModeRef.current = forceContextMode;

      setMemos(initialMemos);
      setMemos(initialMemos);
      // 根据新属性重置是否有更多数据
      setHasMoreOlder(
        (!searchParams.date &&
          !forceContextMode &&
          initialMemos.length >= 10) ||
          (forceContextMode && initialMemos.length === 20),
      );
    } else if (initialMemos.length > 0 && memos.length === 0) {
      setMemos(initialMemos);
    }
  }, [searchParams, initialMemos, forceContextMode, memos.length]);

  // 2. 首页单向抓取逻辑 (无限下拉)
  const fetchMemosBatch = useCallback(
    async (direction: "older") => {
      if (direction === "older" && (isLoadingOlder || !hasMoreOlder)) return;

      setIsLoadingOlder(true);

      try {
        const limit = 20;
        const lastMemo = memos[memos.length - 1];

        // 动态计算该上下文维度的 startIso(作为边界防溢出)
        let afterDateIso: string | undefined = undefined;
        if (forceContextMode && contextType && memos.length > 0) {
          const utcDate = new Date(memos[0].created_at);
          const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
          const currentDateStr = localDate.toISOString().split("T")[0];
          const [yStr, mStr] = currentDateStr.split("-");
          let startIso = "";
          if (contextType === "year") {
            startIso = `${yStr}-01-01T00:00:00.000+08:00`;
          } else if (contextType === "month") {
            startIso = `${yStr}-${mStr}-01T00:00:00.000+08:00`;
          } else {
            startIso = `${currentDateStr}T00:00:00.000+08:00`;
          }
          afterDateIso = new Date(
            new Date(startIso).getTime() - 1,
          ).toISOString();
        }

        const nextMemos = await getMemos({
          ...searchParams,
          adminCode,
          limit,
          before_date: lastMemo?.created_at,
          after_date: afterDateIso,
          sort: "newest",
        });

        const uniqueNew = nextMemos.filter(
          (nm) => !memos.find((m) => m.id === nm.id),
        );
        if (nextMemos.length < limit || uniqueNew.length === 0) {
          setHasMoreOlder(false);
        }
        if (uniqueNew.length > 0)
          setMemos((prev) => mergeMemos(prev, uniqueNew));
      } catch (err) {
        console.error(`[Feed] Failed to load older memos:`, err);
        setHasMoreOlder(false);
      } finally {
        setIsLoadingOlder(false);
      }
    },
    [isLoadingOlder, hasMoreOlder, memos, searchParams, adminCode],
  );

  // 3. 监听哨兵 (向下单一瀑布)
  useEffect(() => {
    const bottom = observerTargetBottom.current;
    if (!bottom) return;

    const bottomObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingOlder && hasMoreOlder) {
          fetchMemosBatch("older");
        }
      },
      { threshold: 0.1, rootMargin: "400px" },
    );
    bottomObserver.observe(bottom);

    return () => {
      bottomObserver.disconnect();
    };
  }, [fetchMemosBatch, isLoadingOlder, hasMoreOlder]);

  // 4. Scroll Spy
  const { setActiveId, isManualClick, setTeleportDate } = useTimeline();
  useEffect(() => {
    if (isManualClick || memos.length === 0) return;
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
  }, [isManualClick, setActiveId, memos.length]);

  const itemVariants: Variants = {
    initial: { opacity: 0, y: -10 },
    animate: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: custom * 0.05,
      },
    }),
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const newerLabel =
    contextType === "year"
      ? "下一年"
      : contextType === "month"
        ? "下一月"
        : "下一日";
  const olderLabel =
    contextType === "year"
      ? "上一年"
      : contextType === "month"
        ? "上一月"
        : "上一日";

  return (
    <div className="space-y-6">
      {/* 上一篇：Calendar Pager Navigator */}
      {forceContextMode && nextAvailableDate && memos.length > 0 ? (
        <div className="py-4 flex flex-col items-center justify-center min-h-[60px]">
          <button
            onClick={() => {
              if (contextType)
                setTeleportDate({ date: nextAvailableDate, type: contextType });
            }}
            className="group flex flex-col items-center gap-2 transition-all duration-300 ease-in-out"
            title={`Go to ${nextAvailableDate}`}
          >
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 group-hover:text-primary transition-colors">
              <span>View Newer memos</span>
              <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                ({nextAvailableDate} {newerLabel})
              </span>
            </div>
          </button>
        </div>
      ) : forceContextMode && !nextAvailableDate && memos.length > 0 ? (
        <div className="min-h-[32px] pt-4" />
      ) : null}

      <motion.div initial={false} className="columns-1 gap-6 space-y-6">
        <AnimatePresence mode="popLayout">
          {memos.map((memo, index) => {
            const utcDate = new Date(memo.created_at);
            const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
            const currentDate = localDate.toISOString().split("T")[0];
            const currentYear = currentDate.split("-")[0];
            const currentMonth = currentDate.split("-")[1];

            const prevMemo = index > 0 ? memos[index - 1] : null;
            let prevDateFull = null;
            if (prevMemo) {
              const prevUtcDate = new Date(prevMemo.created_at);
              const prevLocalDate = new Date(
                prevUtcDate.getTime() + 8 * 60 * 60 * 1000,
              );
              prevDateFull = prevLocalDate.toISOString().split("T")[0];
            }

            const prevYear = prevDateFull ? prevDateFull.split("-")[0] : null;
            const prevMonth = prevDateFull ? prevDateFull.split("-")[1] : null;

            const isFirstOfYear = currentYear !== prevYear;
            const isFirstOfMonth =
              (currentMonth !== prevMonth || isFirstOfYear) &&
              prevDateFull !== null;
            const isFirstOfDay = currentDate !== prevDateFull;

            return (
              <motion.div
                key={memo.id}
                id={`memo-${memo.id}`}
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                custom={index % 20}
                className="break-inside-avoid relative"
              >
                {isFirstOfYear && (
                  <div
                    id={`year-${currentYear}`}
                    className="absolute top-0 invisible"
                    aria-hidden="true"
                  />
                )}
                {isFirstOfMonth && (
                  <div
                    id={`month-${currentYear}-${parseInt(currentMonth)}`}
                    className="absolute top-0 invisible"
                    aria-hidden="true"
                  />
                )}
                {isFirstOfDay && (
                  <div
                    id={`date-${currentDate}`}
                    className="absolute top-0 invisible"
                    aria-hidden="true"
                  />
                )}
                <MemoCard
                  memo={memo}
                  isAdmin={isAdmin}
                  isEditing={editingId === memo.id}
                  onEditChange={(editing, updatedMemo) => {
                    if (!editing && updatedMemo) {
                      setMemos((prev) =>
                        prev.map((m) =>
                          m.id === updatedMemo.id ? updatedMemo : m,
                        ),
                      );
                    }
                    setEditingId(editing ? memo.id : null);
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <div
        ref={observerTargetBottom}
        className="py-4 flex flex-col items-center justify-center min-h-[60px]"
      >
        {/* 模式 1: 时间轴点击的专属上下文 Navigator（底部，仅在当前区间数据耗尽后显示） */}
        {forceContextMode &&
        !hasMoreOlder &&
        prevAvailableDate &&
        memos.length > 0 ? (
          <button
            onClick={() => {
              if (contextType)
                setTeleportDate({ date: prevAvailableDate, type: contextType });
            }}
            className="group flex flex-col items-center gap-2 transition-all duration-300 ease-in-out"
            title={`Go to ${prevAvailableDate}`}
          >
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 group-hover:text-primary transition-colors">
              <span>View Older memos</span>
              <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                ({prevAvailableDate} {olderLabel})
              </span>
            </div>
          </button>
        ) : forceContextMode &&
          !hasMoreOlder &&
          !prevAvailableDate &&
          memos.length > 0 ? (
          <div className="text-center text-xs text-muted-foreground/40 font-mono tracking-widest uppercase">
            --- Zero Content Before ---
          </div>
        ) : /* 模式 2: 长列表无限加载的 Spinner */
        isLoadingOlder ? (
          <div className="flex items-center">
            <HugeiconsIcon
              icon={Loader2}
              size={24}
              className="animate-spin text-muted-foreground/50"
            />
            <span className="ml-2 text-xs text-muted-foreground/60">
              加载更多...
            </span>
          </div>
        ) : !hasMoreOlder && memos.length > 0 && !forceContextMode ? (
          <div className="text-center text-xs text-muted-foreground/40 font-mono tracking-widest uppercase">
            --- The End ---
          </div>
        ) : memos.length === 0 && !isLoadingOlder ? (
          <div className="w-full">
            <MemoCardSkeleton isEmpty={true} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
