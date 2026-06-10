"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import { UserInfo, UserRole } from "@/types/auth"
import { supabase } from "@/lib/supabase"

interface UserContextType {
  user: UserInfo | null
  setUser: React.Dispatch<React.SetStateAction<UserInfo | null>>
  isAdmin: boolean
  loading: boolean
  isMounted: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: UserInfo | null
}) {
  const [user, setUser] = useState<UserInfo | null>(initialUser)
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        setUser(null)
      } else {
        setUser({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          role: (user.app_metadata?.role as UserRole) || "user",
        })
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)

    // Always verify auth state on mount
    fetchUser()

    // 监听实时认证状态变化 (SIGNED_IN, SIGNED_OUT, USER_UPDATED)
    // 这确保了在登录成功后，前端相关的 UI 能够立即更新，而不需要 F5 刷新
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            created_at: session.user.created_at,
            role: (session.user.app_metadata?.role as UserRole) || "user",
          })
        } else {
          fetchUser()
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
     
  }, [fetchUser]) // 移除 initialUser 依赖，防止服务端 layout 刷新导致对象引用变动触发循环

  const isAdmin = user?.role === "admin"

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAdmin,
      loading,
      isMounted,
    }),
    [user, isAdmin, loading, isMounted]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
