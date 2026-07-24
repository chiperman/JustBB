import type { MapMarker } from "@/shared/lib/location-cache"

export interface MapViewProps {
  markers: MapMarker[]
  mode: "mini" | "full"
  className?: string
  interactive?: boolean
  onMarkerClick?: (marker: MapMarker) => void
  onMapClick?: (lat: number, lng: number) => void
  onMarkerDragEnd?: (lat: number, lng: number) => void
}
