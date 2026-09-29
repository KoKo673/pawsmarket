import { Crosshair, MapPin } from 'lucide-react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { faDigits } from '@/lib/fa'
import { useGeoStore } from '@/store/geo.store'
import type { GeoPoint } from '@/types'
import type { StepProps } from './steps'

/** پین کلیک‌پذیر روی نقشه (رنگ برند، سبک مدرن) */
const pinIcon = L.divIcon({
  className: '',
  iconSize: [22, 30],
  iconAnchor: [11, 30],
  html: `<div style="
    width:22px;height:22px;border-radius:50% 50% 50% 0;
    background:#FA5C00;transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35);
  "></div>`,
})

/** کلیک روی نقشه → مختصات در پیش‌نویس */
function ClickPicker({ onPick }: { onPick: (p: GeoPoint) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}

/* ════════════════ مرحله ۳ · انتخاب مکان روی نقشه ════════════════ */

export function StepLocation({ draft, update }: StepProps) {
  const origin = useGeoStore((s) => s.origin)
  const center = draft.location ?? origin

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="draft-address">
          آدرس / محله <span className="text-destructive">*</span>
        </Label>
        <Input
          id="draft-address"
          value={draft.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="مثلاً خیابان ولیعصر، بالاتر از پارک ساعی، تهران"
        />
      </div>

      {/* انتخابگر نقشه */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>
            محل دقیق روی نقشه <span className="text-destructive">*</span>
          </Label>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => update({ location: origin })}>
            <Crosshair className="size-3.5" />
            استفاده از نقطه‌ی جستجو
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          برای ثبت نقطه روی نقشه کلیک کنید — مختصات به‌صورت
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-bold">geography(Point, 4326)</code>
          برای PostGIS ذخیره می‌شود.
        </p>

        <div className="isolate-map relative h-80 w-full overflow-hidden rounded-2xl border border-border shadow-soft">
          <MapContainer center={[center.lat, center.lng]} zoom={13} zoomControl className="h-full w-full">
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <ClickPicker onPick={(p) => update({ location: p })} />
            {draft.location && (
              <Marker
                position={[draft.location.lat, draft.location.lng]}
                icon={pinIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const ll = (e.target as L.Marker).getLatLng()
                    update({ location: { lat: ll.lat, lng: ll.lng } })
                  },
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* نمایش مختصات (جهت LTR برای جلوگیری از به‌هم‌ریختن ارقام) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">عرض جغرافیایی</p>
          <p className="ltr-inline mt-0.5 font-mono text-sm font-bold">
            {draft.location ? faDigits(draft.location.lat.toFixed(6)) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">طول جغرافیایی</p>
          <p className="ltr-inline mt-0.5 font-mono text-sm font-bold">
            {draft.location ? faDigits(draft.location.lng.toFixed(6)) : '—'}
          </p>
        </div>
      </div>

      {!draft.location && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          <MapPin className="size-3.5" />
          برای ادامه روی نقشه یک پین بگذارید
        </p>
      )}
    </div>
  )
}
