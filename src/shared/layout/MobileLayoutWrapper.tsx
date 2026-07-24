"use client"

import { useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

import { MobileNavbar } from "./MobileNavbar"

interface MobileLayoutWrapperProps {
  children: React.ReactNode
}

export function MobileLayoutWrapper({ children }: MobileLayoutWrapperProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  return (
    <>
      {isMounted ? createPortal(<MobileNavbar />, document.body) : null}
      {children}
    </>
  )
}
