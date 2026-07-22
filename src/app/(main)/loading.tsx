"use client"

import { usePathname } from "next/navigation"

import { NavigationPageSkeleton } from "@/shared/layout/NavigationPageSkeleton"
import { useDelayedLoadingVisibility } from "@/shared/hooks/useDelayedLoadingVisibility"

export default function MainRouteLoading() {
  const pathname = usePathname() || "/"
  const showSkeleton = useDelayedLoadingVisibility(true)
  return <NavigationPageSkeleton href={pathname} showSkeleton={showSkeleton} />
}
