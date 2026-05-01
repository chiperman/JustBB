"use client"

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react"
import { Memo } from "@/types/memo"

interface UnlockedMemosContextType {
  unlockedMemoIds: string[]
  unlockedMemos: Record<string, Memo>
  storeUnlockedMemo: (memo: Memo) => void
  getUnlockedMemo: (memoId: string) => Memo | undefined
  clearUnlockedMemos: () => void
}

const UnlockedMemosContext = createContext<
  UnlockedMemosContextType | undefined
>(undefined)

export function UnlockedMemosProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [unlockedMemos, setUnlockedMemos] = useState<Record<string, Memo>>({})

  const storeUnlockedMemo = useCallback((memo: Memo) => {
    setUnlockedMemos((prev) => ({
      ...prev,
      [memo.id]: memo,
    }))
  }, [])

  const getUnlockedMemo = useCallback(
    (memoId: string) => unlockedMemos[memoId],
    [unlockedMemos]
  )

  const clearUnlockedMemos = useCallback(() => {
    setUnlockedMemos({})
  }, [])

  const unlockedMemoIds = useMemo(
    () => Object.keys(unlockedMemos),
    [unlockedMemos]
  )

  const value = useMemo(
    () => ({
      unlockedMemoIds,
      unlockedMemos,
      storeUnlockedMemo,
      getUnlockedMemo,
      clearUnlockedMemos,
    }),
    [
      clearUnlockedMemos,
      getUnlockedMemo,
      storeUnlockedMemo,
      unlockedMemoIds,
      unlockedMemos,
    ]
  )

  return (
    <UnlockedMemosContext.Provider value={value}>
      {children}
    </UnlockedMemosContext.Provider>
  )
}

export function useUnlockedMemos() {
  const context = useContext(UnlockedMemosContext)

  if (context === undefined) {
    throw new Error(
      "useUnlockedMemos must be used within an UnlockedMemosProvider"
    )
  }

  return context
}
