import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ChevronLeft } from 'lucide-react'
import type { Village } from '@/types'
import { useI18n } from '@/hooks/useI18n'
import { governorateName } from '@/features/villages/utils'

/** Marker colours, shared with the map legend. */
// eslint-disable-next-line react-refresh/only-export-components
export const markerColors = { verified: '#10B981', review: '#8B9A65', depopulated: '#D6B46A', selected: '#123C35' }

const pinSvg = (fill: string, size: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 1.25}" viewBox="0 0 32 40">
  <path d="M16 39s13-12.6 13-23A13 13 0 0 0 3 16c0 10.4 13 23 13 23z" fill="${fill}" stroke="#fff" stroke-width="2.2"/>
  <circle cx="16" cy="16" r="4.6" fill="#fff"/>
</svg>`

const iconCache = new Map<string, L.DivIcon>()
const icon = (fill: string, size: number) => {
  const key = `${fill}-${size}`
  if (!iconCache.has(key)) {
    iconCache.set(key, L.divIcon({ className: 'qaryati-marker', html: pinSvg(fill, size), iconSize: [size, size * 1.25], iconAnchor: [size / 2, size * 1.22], popupAnchor: [0, -size] }))
  }
  return iconCache.get(key)!
}

const colorFor = (v: Village) => (v.depopulated ? markerColors.depopulated : v.verification === 'verified' ? markerColors.verified : markerColors.review)

function FlyTo({ target, zoom }: { target?: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, zoom, { duration: 0.8 })
  }, [map, target, zoom])
  return null
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  const key = points.map((p) => p.join(',')).join('|')
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 12 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])
  return null
}

function InvalidateOnResize() {
  const map = useMap()
  useEffect(() => {
    const obs = new ResizeObserver(() => map.invalidateSize())
    obs.observe(map.getContainer())
    return () => obs.disconnect()
  }, [map])
  return null
}

export interface VillageMapProps {
  villages: Village[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** Villages drawn smaller, e.g. neighbours on a details page. */
  secondaryIds?: string[]
  center?: [number, number]
  zoom?: number
  fitToVillages?: boolean
  className?: string
  scrollWheelZoom?: boolean
  /** Show Leaflet popups on marker click (off when the page renders its own card). */
  popups?: boolean
}

export function VillageMap({ villages, selectedId, onSelect, secondaryIds = [], center = [31.95, 35.2], zoom = 9, fitToVillages, className, scrollWheelZoom = true, popups = true }: VillageMapProps) {
  const { t, pick } = useI18n()
  const selected = villages.find((v) => v.id === selectedId)
  const target = useMemo<[number, number] | undefined>(() => (selected ? [selected.coordinates.lat, selected.coordinates.lng] : undefined), [selected])
  const points = useMemo(() => villages.map((v) => [v.coordinates.lat, v.coordinates.lng] as [number, number]), [villages])

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={scrollWheelZoom} className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="qaryati-tiles"
      />
      <InvalidateOnResize />
      {fitToVillages && !selected && <FitBounds points={points} />}
      <FlyTo target={target} zoom={Math.max(zoom, 12)} />
      {villages.map((v) => {
        const isSel = v.id === selectedId
        return (
          <Marker
            key={v.id}
            position={[v.coordinates.lat, v.coordinates.lng]}
            icon={isSel ? icon(markerColors.selected, 38) : icon(colorFor(v), secondaryIds.includes(v.id) ? 24 : 30)}
            zIndexOffset={isSel ? 1000 : 0}
            eventHandlers={{ click: () => onSelect?.(v.id) }}
            title={`${v.name.ar} · ${v.name.en}`}
            alt={v.name.en}
          >
            {popups && (
              <Popup>
                <div className="min-w-44" dir="auto">
                  <p className="text-lg leading-tight font-bold text-forest">
                    {pick(v.name)} <small className="text-xs font-medium text-muted">{v.name.en === pick(v.name) ? v.name.ar : v.name.en}</small>
                  </p>
                  <p className="mt-1 text-xs text-sage">{pick(governorateName(v.governorateId))}</p>
                  <Link to={`/villages/${v.id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-forest! hover:text-accent-dark!">
                    {t('Open profile', 'فتح الملف')}
                    <ChevronLeft className="size-3.5 ltr:rotate-180" />
                  </Link>
                </div>
              </Popup>
            )}
          </Marker>
        )
      })}
    </MapContainer>
  )
}
