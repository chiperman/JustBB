import type { MapMarker } from "@/shared/lib/location-cache"
import type { Location, Memo } from "@/types/memo"

export type MemoWithLocations = Memo & { locations: Location[] }

export function groupMemosByLocation(memos: MemoWithLocations[]): MapMarker[] {
  const groupedMap = new Map<string, MapMarker>()

  memos.forEach((memo) => {
    memo.locations.forEach((loc) => {
      const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`
      if (groupedMap.has(key)) {
        groupedMap.get(key)!.items.push(memo)
      } else {
        groupedMap.set(key, { ...loc, items: [memo] })
      }
    })
  })

  return Array.from(groupedMap.values())
}
