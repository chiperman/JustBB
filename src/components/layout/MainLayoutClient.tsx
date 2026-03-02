"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MemoEditor } from "@/components/ui/MemoEditor";
import { MemoFeed } from "@/components/ui/MemoFeed";
import { FeedHeader } from "@/components/ui/FeedHeader";
import { MemoCardSkeleton } from "@/components/ui/MemoCardSkeleton";
import { Memo } from "@/types/memo";
import { useUser } from "@/context/UserContext";
import { useSelection } from "@/context/SelectionContext";
import { usePageDataCache } from "@/context/PageDataCache";
import { useTimeline } from "@/context/TimelineContext";

interface MainLayoutClientProps {
  memos?: Memo[];
  searchParams?: Record<string, string | string[] | undefined>;
  adminCode?: string;
  initialIsAdmin?: boolean;
}

export function MainLayoutClient({
  memos: initialMemos,
  searchParams = {},
  adminCode,
  initialIsAdmin = false,
}: MainLayoutClientProps) {
  const { isAdmin, loading } = useUser();
  const effectiveIsAdmin = loading ? (initialIsAdmin ?? false) : isAdmin;
  const [isScrolled, setIsScrolled] = useState(false);
  const { isSelectionMode } = useSelection();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { getCache, setCache } = usePageDataCache();

  const { setActiveId, setManualClick } = useTimeline();

  // 构建动态缓存键
  const cacheKey = useMemo(() => {
    const params = new URLSearchParams();
    const getV = (val: string | string[] | undefined) =>
      Array.isArray(val) ? val[0] : (val ?? "");
    const q = getV(searchParams.query);
    const tag = getV(searchParams.tag);
    const year = getV(searchParams.year);
    const month = getV(searchParams.month);
    if (q) params.set("q", q);
    if (tag) params.set("tag", tag);
    if (year) params.set("year", year);
    if (month) params.set("month", month);
    return params.toString() ? `/?${params.toString()}` : "/";
  }, [
    searchParams.query,
    searchParams.tag,
    searchParams.year,
    searchParams.month,
  ]);

  const cached = getCache(cacheKey);
  const [memos, setMemos] = useState<Memo[]>(
    initialMemos ?? cached?.memos ?? [],
  );
  const [lastInitialMemos, setLastInitialMemos] = useState(initialMemos);



  const [isLoading, setIsLoading] = useState(!initialMemos && !cached);

  // 派生状态同步
  const [prevCacheKey, setPrevCacheKey] = useState(cacheKey);
  if (prevCacheKey !== cacheKey) {
    setPrevCacheKey(cacheKey);
    setLastInitialMemos(initialMemos);
    if (initialMemos) setMemos(initialMemos);
    else if (cached) setMemos(cached.memos);
    if (!initialMemos && !cached) setIsLoading(true);
  } else if (initialMemos && initialMemos !== lastInitialMemos) {
    setLastInitialMemos(initialMemos);
    setMemos(initialMemos);
  }

  if (initialMemos) {
    setCache(cacheKey, {
      memos: initialMemos,
      searchParams,
      adminCode,
      initialIsAdmin,
    });
    if (isLoading) setIsLoading(false);
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const top = scrollContainerRef.current.scrollTop;
      setIsScrolled(top > 100);
    }
  };

  const teleportVariants = {
    initial: { y: 100, opacity: 0, filter: "blur(10px)" },
    animate: { y: 0, opacity: 1, filter: "blur(0px)" },
    exit: { y: -100, opacity: 0, filter: "blur(10px)" },
  };

  const feedKey = useMemo(
    () => (memos.length > 0 ? memos[0].id : "empty"),
    [memos],
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-accent/20 relative">
      <div
        ref={headerRef}
        className={cn(
          "flex-none z-30 px-4 md:px-10 sticky top-0 pt-8 pb-4 transition-all duration-300",
          isScrolled
            ? "bg-background/80 backdrop-blur-2xl border-b border-border/40"
            : "bg-background/0",
        )}
      >
        <div className="max-w-4xl mx-auto w-full">
          <div className="space-y-4">
            <FeedHeader />
            <AnimatePresence mode="wait">
              {effectiveIsAdmin && (
                <MemoEditor
                  key="editor"
                  isCollapsed={isScrolled}
                  contextMemos={memos}
                  className={isSelectionMode ? "hidden" : ""}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hover p-4 md:px-10 md:pt-0 md:pb-8 scrollbar-stable scroll-smooth"
      >
        <div className="max-w-4xl mx-auto w-full pb-20">
          {isLoading ? (
            <div className="space-y-6">
              <MemoCardSkeleton />
              <MemoCardSkeleton />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={feedKey}
                variants={teleportVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              >
                <MemoFeed
                  initialMemos={memos}
                  searchParams={searchParams}
                  adminCode={adminCode}
                  isAdmin={effectiveIsAdmin}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

    </div>
  );
}
