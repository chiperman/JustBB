"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useMapMemos } from "./hooks/useMapMemos"
import { MapLoadingScreen } from "./components/MapLoadingScreen"
import { MapErrorScreen } from "./components/MapErrorScreen"
import {
  ContextPageShell,
  ContextPageHeader,
} from "@/shared/layout/ContextPageShell"
import { Location04Icon } from "@hugeicons/core-free-icons"

export function MapPageContent() {
  const { markers, isLoading, MapView } = useMapMemos()

  return (
    <ContextPageShell
      scrollable={false}
      maxWidthClassName="max-w-screen-xl h-full flex flex-col min-h-0"
      contentClassName="flex-1 h-full min-h-0 pt-4 pb-6 flex flex-col"
      header={
        <ContextPageHeader
          icon={Location04Icon}
          title="地图"
          actions={
            <span className="text-xs text-muted-foreground font-mono tabular-nums bg-secondary/80 px-2 py-1 rounded border border-border/40">
              {markers.length} 个定位点
            </span>
          }
        />
      }
    >
      <div className="flex-1 min-h-0 relative">
        <div className="relative h-full w-full overflow-hidden rounded-inner bg-card ring-1 ring-border/70">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <MapLoadingScreen />
            ) : MapView ? (
              <motion.div
                key="map"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full"
              >
                <MapView
                  markers={markers}
                  mode="full"
                  className="w-full h-full min-h-[500px]"
                />
              </motion.div>
            ) : (
              <MapErrorScreen />
            )}
          </AnimatePresence>
        </div>
      </div>
    </ContextPageShell>
  )
}
