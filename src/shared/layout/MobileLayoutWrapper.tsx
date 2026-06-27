"use client"

import { MobileNavbar } from "./MobileNavbar"

interface MobileLayoutWrapperProps {
  children: React.ReactNode
}

export function MobileLayoutWrapper({ children }: MobileLayoutWrapperProps) {
  return (
    <>
      <MobileNavbar />
      {children}
    </>
  )
}
