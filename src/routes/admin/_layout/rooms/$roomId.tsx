/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../../../services/api'
import type { Room, RoomMode, RoomUpdatePayload } from '../../../../services/api'
import { RoomControls } from '../../../../components/admin/RoomControls'
import { Runsheet } from '../../../../components/admin/Runsheet'
import { ZoneEditor } from '../../../../components/admin/ZoneEditor'
import { TimerForm } from '../../../../components/admin/TimerForm'
import { Toggle } from '../../../../components/ui/Toggle'

export const Route = createFileRoute('/admin/_layout/rooms/$roomId')({
  component: RoomDetailPage,
})

function RoomDetailPage() {
  const { roomId: roomIdRaw } = Route.useParams()
  const api = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const roomId = Number(roomIdRaw)
  const invalidId = !Number.isInteger(roomId) || roomId <= 0

  const { data: room, isLoading, isError, refetch } = useQuery({
    queryKey: ['rooms', roomId],
    queryFn: () => api.rooms.get(roomId),
    enabled: !invalidId,
  })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['rooms'] })
    void refetch()
  }

  if (invalidId) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="rounded-lg border border-[#FF2040]/30 bg-[#FF2040]/5 px-5 py-4">
          <p className="font-mono text-sm text-[#FF2040]">
            Invalid room id: "{roomIdRaw}".
          </p>
        </div>
        <Link
          to="/admin/rooms"
          className="mt-4 inline-block font-mono text-xs text-cue-muted hover:text-cue-primary transition-colors duration-[120ms]"
        >
          ← Back to rooms
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="h-72 animate-fetching rounded-lg border border-cue-border bg-cue-surface" />
      </div>
    )
  }

  if (isError || !room) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="rounded-lg border border-[#FF2040]/30 bg-[#FF2040]/5 px-5 py-4">
          <p className="font-mono text-sm text-[#FF2040]">
            Failed to load room #{roomId}.
          </p>
        </div>
        <Link
          to="/admin/rooms"
          className="mt-4 inline-block font-mono text-xs text-cue-muted hover:text-cue-primary transition-colors duration-[120ms]"
        >
          ← Back to rooms
        </Link>
      </div>
    )
  }

  async function handleDelete() {
    if (!confirm(`Delete room "${room!.name}"? This will also delete its timers and zones.`)) return
    await api.rooms.delete(roomId)
    invalidate()
    void navigate({ to: '/admin/rooms' })
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 bg-dot-grid min-h-full">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Link
            to="/admin/rooms"
            className="font-mono text-xs text-cue-muted hover:text-cue-primary transition-colors duration-[120ms]"
          >
            ← All rooms
          </Link>
          <h2 className="mt-2 font-display text-3xl leading-none tracking-wider text-cue-primary">
            {room.name}
          </h2>
          <p className="mt-1 font-mono text-xs text-cue-muted">
            #{room.id} · {room.mode}
          </p>
        </div>
      </div>

      {/* Controls (current timer + schedule nav + overlays) */}
      <section className="mb-6">
        <RoomControls initialRoom={room} onMutated={invalidate} />
      </section>

      {/* Simple-mode: edit the single timer inline */}
      {room.mode === 'simple' && room.timers.length === 1 && (
        <section className="mb-6">
          <SimpleModeTimerCard room={room} onMutated={invalidate} />
        </section>
      )}

      {/* Schedule-mode: runsheet */}
      {room.mode === 'schedule' && (
        <section className="mb-6">
          <Runsheet room={room} onMutated={invalidate} />
        </section>
      )}

      {/* Zones */}
      <section className="mb-6">
        <ZoneEditor room={room} onMutated={invalidate} />
      </section>

      {/* Room settings */}
      <section className="mb-6">
        <RoomSettings
          key={room.updated_at}
          room={room}
          onMutated={invalidate}
          onDelete={handleDelete}
        />
      </section>
    </div>
  )
}

interface SimpleModeProps {
  room: Room
  onMutated: () => void
}

function SimpleModeTimerCard({ room, onMutated }: SimpleModeProps) {
  const [editing, setEditing] = useState(false)
  const timer = room.timers[0]

  return (
    <div className="rounded-lg border border-cue-border bg-cue-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-cue-border px-5 py-3">
        <div>
          <h3 className="font-display text-lg leading-none tracking-wider text-cue-primary">
            TIMER DETAILS
          </h3>
          <p className="mt-1 font-mono text-[10px] text-cue-muted tracking-widest uppercase">
            The single timer driving this room
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded border border-cue-border px-3 py-1.5 font-display text-xs tracking-widest text-cue-muted hover:border-cue-accent hover:text-cue-accent transition-colors duration-[120ms]"
          >
            EDIT
          </button>
        )}
      </div>

      <div className="p-5">
        {editing ? (
          <TimerForm
            roomId={room.id}
            initial={timer}
            onSaved={() => { setEditing(false); onMutated() }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 font-mono text-xs">
            <Detail label="Internal name" value={timer.name} />
            <Detail label="Duration" value={`${timer.duration}s`} />
            <Detail label="Session title" value={timer.session_title || '—'} />
            <Detail label="Speaker" value={timer.speaker_name || '—'} />
          </div>
        )}
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-widest text-cue-muted uppercase">{label}</div>
      <div className="mt-1 font-display text-sm text-cue-primary">{value}</div>
    </div>
  )
}

interface SettingsProps {
  room: Room
  onMutated: () => void
  onDelete: () => void
}

function RoomSettings({ room, onMutated, onDelete }: SettingsProps) {
  const api = useApi()
  const [name, setName] = useState(room.name)
  const [accentColor, setAccentColor] = useState(room.accent_color)
  const [fontSize, setFontSize] = useState(room.font_size)
  const [showClock, setShowClock] = useState(room.show_clock)
  const [autoAdvance, setAutoAdvance] = useState(room.auto_advance)
  const [handoverSeconds, setHandoverSeconds] = useState(String(room.handover_seconds))
  const [mode, setMode] = useState<RoomMode>(room.mode)
  const [debateEnabled, setDebateEnabled] = useState(room.debate_enabled)
  const [poiEnabled, setPoiEnabled] = useState(room.poi_enabled)
  const [protectedOpen, setProtectedOpen] = useState(String(room.protected_open_seconds))
  const [protectedClose, setProtectedClose] = useState(String(room.protected_close_seconds))
  const [graceSeconds, setGraceSeconds] = useState(String(room.grace_seconds))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: eligibility } = useQuery({
    queryKey: ['rooms', room.id, 'mode-switch-eligibility'],
    queryFn: () => api.rooms.getModeSwitchEligibility(room.id),
  })

  const simpleBlocked = eligibility ? !eligibility.can_switch_to_simple : false
  const scheduleBlocked = eligibility ? !eligibility.can_switch_to_schedule : false

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload: RoomUpdatePayload = {
        name: name.trim(),
        accent_color: accentColor,
        font_size: fontSize,
        show_clock: showClock,
        auto_advance: autoAdvance,
        handover_seconds: parseInt(handoverSeconds, 10) || 0,
        mode,
      }
      if (mode === 'schedule') {
        payload.debate_enabled = debateEnabled
        payload.poi_enabled = poiEnabled
        payload.protected_open_seconds = parseInt(protectedOpen, 10) || 0
        payload.protected_close_seconds = parseInt(protectedClose, 10) || 0
        payload.grace_seconds = parseInt(graceSeconds, 10) || 0
      }
      await api.rooms.patch(room.id, payload)
      onMutated()
    } catch {
      setError('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-cue-border bg-cue-surface shadow-sm">
      <div className="border-b border-cue-border px-5 py-3">
        <h3 className="font-display text-lg leading-none tracking-wider text-cue-primary">
          SETTINGS
        </h3>
        <p className="mt-1 font-mono text-[10px] text-cue-muted tracking-widest uppercase">
          Branding, mode, handover defaults
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          />
        </Field>

        <Field label="Mode">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as RoomMode)}
            className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          >
            <option value="simple" disabled={mode !== 'simple' && simpleBlocked}>
              Simple (ad-hoc timer)
            </option>
            <option value="schedule" disabled={mode !== 'schedule' && scheduleBlocked}>
              Schedule (runsheet)
            </option>
          </select>
          {mode !== 'simple' && simpleBlocked && eligibility?.required_action && (
            <p className="mt-1 font-mono text-[10px] text-[#FFAA00]">
              Can't switch to simple: {eligibility.required_action}
            </p>
          )}
          {mode !== 'schedule' && scheduleBlocked && eligibility?.required_action && (
            <p className="mt-1 font-mono text-[10px] text-[#FFAA00]">
              Can't switch to schedule: {eligibility.required_action}
            </p>
          )}
        </Field>

        <Field label="Font Size">
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value as Room['font_size'])}
            className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </Field>

        <Field label="Accent Colour">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-9 w-16 cursor-pointer rounded border border-cue-border bg-cue-base p-0.5"
            />
            <span className="font-mono text-xs text-cue-muted">{accentColor}</span>
          </div>
        </Field>

        <Field label="Wall Clock">
          <div className="flex items-center gap-3 py-2">
            <Toggle checked={showClock} onChange={setShowClock} label="Show wall clock" />
            <span className="font-mono text-xs text-cue-muted">Show wall clock</span>
          </div>
        </Field>

        {mode === 'schedule' && (
          <>
            <Field label="Default Handover (sec)">
              <input
                type="number"
                min="0"
                value={handoverSeconds}
                onChange={(e) => setHandoverSeconds(e.target.value)}
                className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
              />
            </Field>

            <Field label="Auto-advance">
              <div className="flex items-center gap-3 py-2">
                <Toggle checked={autoAdvance} onChange={setAutoAdvance} label="Auto-advance" />
                <span className="font-mono text-xs text-cue-muted">Roll forward automatically</span>
              </div>
            </Field>
          </>
        )}
      </div>

      {/* Debate mode (schedule only) */}
      {mode === 'schedule' && (
        <div className="border-t border-cue-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-xs font-medium tracking-widest text-cue-primary uppercase">
                Debate Mode
              </span>
              <span className="font-mono text-[10px] text-cue-muted">
                British Parliamentary — POIs, protected time, bells.
              </span>
            </div>
            <Toggle checked={debateEnabled} onChange={setDebateEnabled} label="Toggle debate mode" />
          </div>

          {debateEnabled && (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="POIs Allowed">
                  <div className="flex items-center gap-3 py-2">
                    <Toggle checked={poiEnabled} onChange={setPoiEnabled} label="POIs allowed" />
                    <span className="font-mono text-xs text-cue-muted">
                      Points of Information permitted
                    </span>
                  </div>
                </Field>

                <Field label="Grace (sec)">
                  <input
                    type="number"
                    min="0"
                    value={graceSeconds}
                    onChange={(e) => setGraceSeconds(e.target.value)}
                    className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
                  />
                </Field>

                <Field label="Protected — Open (sec)">
                  <input
                    type="number"
                    min="0"
                    value={protectedOpen}
                    onChange={(e) => setProtectedOpen(e.target.value)}
                    className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
                  />
                </Field>

                <Field label="Protected — Close (sec)">
                  <input
                    type="number"
                    min="0"
                    value={protectedClose}
                    onChange={(e) => setProtectedClose(e.target.value)}
                    className="w-full rounded border border-cue-border bg-cue-base px-3 py-2 font-mono text-sm text-cue-primary focus:border-cue-accent focus:outline-none transition-colors duration-[120ms]"
                  />
                </Field>
              </div>
              {autoAdvance && (
                <p className="mt-3 font-mono text-[10px] text-[#FFAA00]">
                  Tip: debates usually run with Auto-advance off so the chair advances each speech manually.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="px-5 pb-2 font-mono text-xs text-[#FF2040]">{error}</p>
      )}

      <div className="flex items-center justify-between border-t border-cue-border px-5 py-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="rounded bg-cue-accent px-5 py-2 font-display text-sm tracking-widest text-white hover:bg-[#0044AA] disabled:opacity-50 transition-colors duration-[120ms]"
        >
          {saving ? 'SAVING…' : 'SAVE SETTINGS'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="font-mono text-xs text-cue-muted hover:text-[#FF2040] transition-colors duration-[120ms]"
        >
          Delete room
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-xs font-medium tracking-widest text-cue-muted uppercase">
        {label}
      </label>
      {children}
    </div>
  )
}
