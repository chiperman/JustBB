import { useState, useEffect, useRef, useCallback } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { MemoCard } from "./MemoCard";
import { MemoCardSkeleton } from "./MemoCardSkeleton";
import { getMemos } from "@/actions/memos/query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon as Loader2 } from "@hugeicons/core-free-icons";
import { Memo } from "@/types/memo";
import { useUI } from "@/context/UIContext";
import { mergeMemos } from "@/lib/streamUtils";

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
}

export function MemoFeed({
  initialMemos = [],
  searchParams,
  adminCode,
  isAdmin = false,
}: MemoFeedProps) {
  const [memos, setMemos] = useState<Memo[]>(initialMemos);
  const [hasMoreOlder, setHasMoreOlder] = useState(initialMemos.length >= 20);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const observerTargetBottom = useRef<HTMLDivElement>(null);

  // 2. 首页单向抓取逻辑 (无限下拉)
  const fetchMemosBatch = useCallback(
    async (direction: "older") => {
      console.log('[MemoFeed] fetchMemosBatch triggered:', { direction, isLoadingOlder, hasMoreOlder });
      if (direction === "older" && (isLoadingOlder || !hasMoreOlder)) {
        console.log('[MemoFeed] fetchMemosBatch skipped:', { isLoadingOlder, hasMoreOlder });
        return;
      }

      setIsLoadingOlder(true);

      try {
        const limit = 20;
        // 关键修复：游标必须使用最旧的“非置顶”记录，否则旧的置顶记录会把游标带入过去，导致中间的普通记录被跳过
        const unpinnedMemos = memos.filter(m => !m.is_pinned);
        const lastMemo = unpinnedMemos.length > 0 ? unpinnedMemos[unpinnedMemos.length - 1] : memos[memos.length - 1];

        const [nextMemosResponse] = await Promise.all([
          getMemos({
            ...searchParams,
            adminCode,
            limit,
            before_date: lastMemo?.created_at,
            excludePinned: true, // 向下滚动加载更多时，排除置顶内容，避免重复和干扰游标
            sort: "newest",
          }),
          new Promise((resolve) => setTimeout(resolve, 1000)), // 保证至少有 1000ms 的动画时间
        ]);

        const nextMemos = nextMemosResponse.data || [];

        // Filter to ensure we do not exceed the context boundary
        let validNewMemos = nextMemos.filter(
          (nm) => !memos.find((m) => m.id === nm.id),
        );

        validNewMemos = validNewMemos.filter((nm) => {
          const memoDate = new Date(new Date(nm.created_at).getTime() + 8 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]; // YYYY-MM-DD
          if (searchParams.year && searchParams.month) return memoDate.startsWith(`${searchParams.year}-${String(searchParams.month).padStart(2, "0")}`);
          if (searchParams.year) return memoDate.startsWith(searchParams.year);
          if (searchParams.date) return memoDate === searchParams.date;
          return true;
        });

        // If no valid new memos are returned, or we hit a natural end of limit
        if (nextMemos.length < limit || validNewMemos.length === 0) {
          setHasMoreOlder(false);
        }

        if (validNewMemos.length > 0)
          setMemos((prev) => mergeMemos(prev, validNewMemos));
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
      {
        root: null, // 默认使用 Viewport，更稳定
        rootMargin: "0px 0px 1200px 0px", // 提前 1200px 开始加载，保证无感过度
        threshold: 0
      },
    );
    bottomObserver.observe(bottom);

    return () => {
      bottomObserver.disconnect();
    };
  }, [fetchMemosBatch, isLoadingOlder, hasMoreOlder]);

  // 4. Scroll Spy
  const { setActiveId, isManualClick } = useUI();
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



  return (
    <div className="space-y-6">


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

            const isFirstOfYear = currentYear !== prevYear && !memo.is_pinned;
            const isFirstOfMonth =
              (currentMonth !== prevMonth || isFirstOfYear) &&
              prevDateFull !== null && !memo.is_pinned;
            const isFirstOfDay = currentDate !== prevDateFull && !memo.is_pinned;

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

        {isLoadingOlder ? (
          <div className="flex items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="flex items-center justify-center"
            >
              <HugeiconsIcon
                icon={Loader2}
                size={24}
                className="text-muted-foreground/50 transform-gpu will-change-transform"
              />
            </motion.div>
            <span className="ml-2 text-xs text-muted-foreground/60">
              加载更多...
            </span>
          </div>
        ) : !hasMoreOlder && memos.length > 0 ? (
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
