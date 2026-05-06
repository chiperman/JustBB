"use client"

import { useEffect } from "react"

export function PWARegistration() {
  useEffect(() => {
    // 彻底移除已注册的 Service Workers 以解决缓存导致的 404 问题
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log("Service Worker unregistration successful")
              // 注销成功后刷新页面以确保获取最新资源
              window.location.reload()
            }
          })
        }
      })
    }
  }, [])

  return null
}
