"use client"

import React, { createContext, useContext, useMemo, useState, useCallback } from "react"
import { Memo } from "@/types/memo"

interface UnlockedMemosContextType {
  unlockedMemoIds: string[]
  unlockedMemos: Record<string, Memo>
  storeUnlockedMemo: (memo: Memo) => void
  getUnlockedMemo: (memoId: string) => Memo | undefined
  clearUnlockedMemos: () => void
  verifiedPasswords: string[]
  addVerifiedPassword: (password: string) => void
}

const UnlockedMemosContext = createContext<UnlockedMemosContextType | undefined>(undefined)

interface UnlockedMemosProviderProps {
  children: React.ReactNode
  initialUnlockedMemos?: Record<string, Memo>
  initialVerifiedPasswords?: string[]
  onStoreUnlockedMemo?: (memo: Memo) => void
  onAddVerifiedPassword?: (password: string) => void
}

export function UnlockedMemosProvider({
  children,
  initialUnlockedMemos,
  initialVerifiedPasswords,
  onStoreUnlockedMemo,
  onAddVerifiedPassword,
}: UnlockedMemosProviderProps) {
  const [unlockedMemos, setUnlockedMemos] = useState<Record<string, Memo>>(
    () => initialUnlockedMemos ?? {}
  )
  const [verifiedPasswords, setVerifiedPasswords] = useState<string[]>(
    () => initialVerifiedPasswords ?? []
  )

  const storeUnlockedMemo = useCallback(
    (memo: Memo) => {
      setUnlockedMemos((prev) => ({
        ...prev,
        [memo.id]: memo,
      }))
      onStoreUnlockedMemo?.(memo)
    },
    [onStoreUnlockedMemo]
  )

  const addVerifiedPassword = useCallback(
    (password: string) => {
      setVerifiedPasswords((prev) => {
        if (prev.includes(password)) return prev
        return [...prev, password]
      })
      onAddVerifiedPassword?.(password)
    },
    [onAddVerifiedPassword]
  )

  const getUnlockedMemo = useCallback((memoId: string) => unlockedMemos[memoId], [unlockedMemos])

  const clearUnlockedMemos = useCallback(() => {
    setUnlockedMemos({})
    setVerifiedPasswords([])
  }, [])

  const unlockedMemoIds = useMemo(() => Object.keys(unlockedMemos), [unlockedMemos])

  const value = useMemo(
    () => ({
      unlockedMemoIds,
      unlockedMemos,
      storeUnlockedMemo,
      getUnlockedMemo,
      clearUnlockedMemos,
      verifiedPasswords,
      addVerifiedPassword,
    }),
    [
      clearUnlockedMemos,
      getUnlockedMemo,
      storeUnlockedMemo,
      unlockedMemoIds,
      unlockedMemos,
      verifiedPasswords,
      addVerifiedPassword,
    ]
  )

  return <UnlockedMemosContext.Provider value={value}>{children}</UnlockedMemosContext.Provider>
}

export function useUnlockedMemos() {
  const context = useContext(UnlockedMemosContext)

  if (context === undefined) {
    throw new Error("useUnlockedMemos must be used within an UnlockedMemosProvider")
  }

  return context
}

export function useOptionalUnlockedMemos() {
  return useContext(UnlockedMemosContext)
}
