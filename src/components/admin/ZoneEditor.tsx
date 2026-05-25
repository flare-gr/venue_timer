import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApi } from '../../services/api'
import type { Room, Timer, Zone, ZoneCreatePayload, ZoneUpdatePayload } from '../../services/api'

interface ZoneEditorProps {
  room: Room
  onMutated: () => void
}

function DEFAULTS(order: number): ZoneCreatePayload {
  return {
    label: 'New Zone',
    threshold: 60,
    color: '#FFAA00',
    tint_opacity: 20,
    order,
  }
}

interface RowProps {
  zone: Zone
  acting: boolean
  onPatch: (payload: ZoneUpdatePayload) => Promise<void>
  onDelete: () => Promise<void>
}

function ZoneRow({ zone, acting, onPatch, onDelete }: RowProps) {
  const { t } = useTranslation('admin')
  const [label, setLabel] = useState(zone.label)
  const [threshold, setThreshold] = useState(String(zone.threshold))
  const [color, setColor] = useState(zone.color)
  const [tintOpacity, setTintOpacity] = useState(zone.tint_opacity)

  async function commit() {
    const t = parseInt(threshold, 10)
    if (!isFinite(t) || t < 0) return
    if (
      label === zone.label &&
      t === zone.threshold &&
      color === zone.color &&
      tintOpacity === zone.tint_opacity
    ) return
    await onPatch({ label, threshold: t, color, tint_opacity: tintOpacity })
  }

  return (
    <div className="grid grid-cols-12 items-center gap-2 rounded border border-cue-border bg-cue-base/40 px-3 py-2">
      <div className="col-span-3">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={commit}
          className="w-full rounded border border-cue-border bg-cue-surface px-2 py-1 font-mono text-xs text-cue-primary focus:border-cue-accent focus:outline-none"
        />
      </div>
      <div className="col-span-2 flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          onBlur={commit}
          className="w-full rounded border border-cue-border bg-cue-surface px-2 py-1 font-mono text-xs tabular-nums text-cue-primary focus:border-cue-accent focus:outline-none"
        />
        <span className="font-mono text-[10px] text-cue-muted">s</span>
      </div>
      <div className="col-span-2 flex items-center gap-1.5">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          onBlur={commit}
          className="h-7 w-12 cursor-pointer rounded border border-cue-border bg-cue-surface p-0.5"
        />
        <span className="font-mono text-[10px] text-cue-muted">{color}</span>
      </div>
      <div className="col-span-4 flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          value={tintOpacity}
          onChange={(e) => setTintOpacity(parseInt(e.target.value, 10))}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="flex-1"
        />
        <span className="w-10 font-mono text-[10px] tabular-nums text-cue-muted text-right">{tintOpacity}%</span>
      </div>
      <div className="col-span-1 flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          disabled={acting}
          className="rounded border border-[#FF2040]/40 px-2 py-1 font-mono text-[10px] text-[#FF2040]/80 uppercase tracking-widest hover:border-[#FF2040] hover:text-[#FF2040] disabled:opacity-30 transition-colors duration-[120ms]"
        >
          {t('zones.del')}
        </button>
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  description: string
  zones: Zone[]
  acting: boolean
  onCreate: () => Promise<void>
  onPatch: (zoneId: number, payload: ZoneUpdatePayload) => Promise<void>
  onDelete: (zoneId: number) => Promise<void>
  trailing?: React.ReactNode
}

function ZoneSection({
  title, description, zones, acting, onCreate, onPatch, onDelete, trailing,
}: SectionProps) {
  const { t } = useTranslation(['admin', 'common'])
  const sorted = [...zones].sort((a, b) => b.threshold - a.threshold)

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h4 className="font-display text-base leading-none tracking-wider text-cue-primary">
            {title}
          </h4>
          <p className="mt-1 font-mono text-[10px] text-cue-muted tracking-widest uppercase">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {trailing}
          <button
            type="button"
            onClick={onCreate}
            disabled={acting}
            className="rounded border border-cue-accent px-3 py-1 font-display text-xs tracking-widest text-cue-accent hover:bg-cue-accent/10 disabled:opacity-50 transition-colors duration-[120ms]"
          >
            {t('zones.addZone')}
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="rounded border border-dashed border-cue-border px-3 py-4 text-center font-mono text-[11px] text-cue-muted">
          {t('zones.empty')}
        </p>
      ) : (
        <>
          <div className="hidden grid-cols-12 gap-2 px-3 font-mono text-[9px] font-semibold tracking-widest text-cue-muted/70 uppercase sm:grid">
            <span className="col-span-3">{t('zones.colLabel')}</span>
            <span className="col-span-2">{t('zones.colThreshold')}</span>
            <span className="col-span-2">{t('zones.colColour')}</span>
            <span className="col-span-4">{t('zones.colTintOpacity')}</span>
            <span className="col-span-1 text-right">{t('common:dash')}</span>
          </div>
          <div className="space-y-1.5">
            {sorted.map((z) => (
              <ZoneRow
                key={z.id}
                zone={z}
                acting={acting}
                onPatch={(p) => onPatch(z.id, p)}
                onDelete={() => onDelete(z.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function ZoneEditor({ room, onMutated }: ZoneEditorProps) {
  const { t } = useTranslation('admin')
  const api = useApi()
  const [acting, setActing] = useState(false)

  const current: Timer | null = room.timers.find((t) => t.id === room.current_timer) ?? null
  const hasOverride = current?.zone_overrides !== null && current?.zone_overrides !== undefined
  const overrideZones = current?.zone_overrides ?? []

  async function createRoomZone() {
    setActing(true)
    try {
      const next = (room.zones.length
        ? Math.max(...room.zones.map((z) => z.order)) + 1
        : 0)
      await api.roomZones.create(room.id, { ...DEFAULTS(next), label: t('zones.newZone') })
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function patchRoomZone(zoneId: number, payload: ZoneUpdatePayload) {
    setActing(true)
    try {
      await api.roomZones.patch(room.id, zoneId, payload)
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function deleteRoomZone(zoneId: number) {
    setActing(true)
    try {
      await api.roomZones.delete(room.id, zoneId)
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function createTimerZone() {
    if (!current) return
    setActing(true)
    try {
      const next = (overrideZones.length
        ? Math.max(...overrideZones.map((z) => z.order)) + 1
        : 0)
      await api.timerZones.create(room.id, current.id, { ...DEFAULTS(next), label: t('zones.newZone') })
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function patchTimerZone(zoneId: number, payload: ZoneUpdatePayload) {
    if (!current) return
    setActing(true)
    try {
      await api.timerZones.patch(room.id, current.id, zoneId, payload)
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function deleteTimerZone(zoneId: number) {
    if (!current) return
    setActing(true)
    try {
      await api.timerZones.delete(room.id, current.id, zoneId)
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function copyDefaultsToCurrent() {
    if (!current) return
    setActing(true)
    try {
      for (const z of room.zones) {
        await api.timerZones.create(room.id, current.id, {
          label: z.label,
          threshold: z.threshold,
          color: z.color,
          tint_opacity: z.tint_opacity,
          order: z.order,
        })
      }
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function revertToDefaults() {
    if (!current) return
    if (!confirm(t('zones.revertConfirm'))) return
    setActing(true)
    try {
      for (const z of overrideZones) {
        await api.timerZones.delete(room.id, current.id, z.id)
      }
      onMutated()
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="space-y-6 rounded-lg border border-cue-border bg-cue-surface px-5 py-4 shadow-sm">
      <div>
        <h3 className="font-display text-lg leading-none tracking-wider text-cue-primary">
          {t('zones.heading')}
        </h3>
        <p className="mt-1 font-mono text-[10px] text-cue-muted tracking-widest uppercase">
          {t('zones.description')}
        </p>
      </div>

      <ZoneSection
        title={t('zones.roomDefaults')}
        description={t('zones.roomDefaultsDesc')}
        zones={room.zones}
        acting={acting}
        onCreate={createRoomZone}
        onPatch={patchRoomZone}
        onDelete={deleteRoomZone}
      />

      {current && (
        <ZoneSection
          title={t('zones.currentSession', { title: current.session_title || current.name })}
          description={
            hasOverride
              ? t('zones.overrideActiveDesc')
              : t('zones.inheritingDesc')
          }
          zones={overrideZones}
          acting={acting}
          onCreate={createTimerZone}
          onPatch={patchTimerZone}
          onDelete={deleteTimerZone}
          trailing={
            <>
              {hasOverride && (
                <button
                  type="button"
                  onClick={revertToDefaults}
                  disabled={acting}
                  className="rounded border border-[#FF2040]/40 px-3 py-1 font-mono text-[10px] tracking-widest text-[#FF2040]/80 uppercase hover:border-[#FF2040] hover:text-[#FF2040] disabled:opacity-50 transition-colors duration-[120ms]"
                >
                  {t('zones.revert')}
                </button>
              )}
              {!hasOverride && room.zones.length > 0 && (
                <button
                  type="button"
                  onClick={copyDefaultsToCurrent}
                  disabled={acting}
                  className="rounded border border-cue-border px-3 py-1 font-mono text-[10px] tracking-widest text-cue-muted uppercase hover:border-cue-accent hover:text-cue-accent disabled:opacity-50 transition-colors duration-[120ms]"
                >
                  {t('zones.copyDefaults')}
                </button>
              )}
            </>
          }
        />
      )}
    </div>
  )
}
