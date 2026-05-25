import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useApi } from '../../services/api'
import type { Room, Timer } from '../../services/api'
import { TimerStateBadge } from './StateBadge'
import { TimerForm } from './TimerForm'

interface RunsheetProps {
  room: Room
  onMutated: () => void
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${mm}:${ss}`
  return `${mm}:${ss}`
}

interface RowProps {
  timer: Timer
  index: number
  total: number
  isCurrent: boolean
  acting: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onSkipTo: () => void
  onEdit: () => void
  onDelete: () => void
}

function RunsheetRow({
  timer, index, total, isCurrent, acting,
  onMoveUp, onMoveDown, onSkipTo, onEdit, onDelete,
}: RowProps) {
  const { t } = useTranslation('admin')
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: timer.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'flex items-center gap-3 rounded border bg-cue-surface px-3 py-2.5',
        isCurrent ? 'border-cue-accent' : 'border-cue-border',
      ].join(' ')}
    >
      {/* Drag handle */}
      <button
        type="button"
        aria-label={t('runsheet.dragToReorder')}
        className="shrink-0 cursor-grab touch-none text-cue-muted hover:text-cue-primary transition-colors duration-[120ms] active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>

      {/* Order # */}
      <span className="w-6 shrink-0 text-center font-mono text-xs font-semibold text-cue-muted tabular-nums">
        {index + 1}
      </span>

      {/* Up/down buttons */}
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          aria-label={t('runsheet.moveUp')}
          onClick={onMoveUp}
          disabled={acting || index === 0}
          className="rounded border border-cue-border px-1 leading-none text-cue-muted hover:border-cue-accent hover:text-cue-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-[120ms]"
        >
          <span className="font-mono text-[10px]">▲</span>
        </button>
        <button
          type="button"
          aria-label={t('runsheet.moveDown')}
          onClick={onMoveDown}
          disabled={acting || index === total - 1}
          className="rounded border border-cue-border px-1 leading-none text-cue-muted hover:border-cue-accent hover:text-cue-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-[120ms]"
        >
          <span className="font-mono text-[10px]">▼</span>
        </button>
      </div>

      {/* Title / speaker / handover */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {timer.role && (
            <span className="shrink-0 rounded border border-cue-accent/40 bg-cue-accent/[0.06] px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-cue-accent">
              {timer.role}
            </span>
          )}
          <span className="font-display text-base leading-none tracking-wide text-cue-primary truncate">
            {timer.session_title || timer.name}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-cue-muted">
          {timer.speaker_name && <span className="truncate">{timer.speaker_name}</span>}
          {timer.speaker_name && <span className="text-cue-muted/40">·</span>}
          <span className="tabular-nums">{formatDuration(timer.duration)}</span>
          {timer.handover_seconds !== null && (
            <>
              <span className="text-cue-muted/40">·</span>
              <span className="text-[#FFAA00]/80">{t('runsheet.handoverSuffix', { seconds: timer.handover_seconds })}</span>
            </>
          )}
        </div>
      </div>

      {/* State + actions */}
      <div className="flex items-center gap-2 shrink-0">
        <TimerStateBadge state={timer.state} />
        <button
          type="button"
          onClick={onSkipTo}
          disabled={acting || isCurrent}
          title={t('runsheet.jumpTitle')}
          className="rounded border border-cue-border px-2 py-1 font-mono text-[10px] tracking-widest text-cue-muted uppercase hover:border-cue-accent hover:text-cue-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-[120ms]"
        >
          {t('runsheet.jump')}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded border border-cue-border px-2 py-1 font-mono text-[10px] tracking-widest text-cue-muted uppercase hover:border-cue-accent hover:text-cue-accent transition-colors duration-[120ms]"
        >
          {t('runsheet.edit')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={acting}
          className="rounded border border-[#FF2040]/40 px-2 py-1 font-mono text-[10px] tracking-widest text-[#FF2040]/80 uppercase hover:border-[#FF2040] hover:text-[#FF2040] disabled:opacity-30 transition-colors duration-[120ms]"
        >
          {t('runsheet.del')}
        </button>
      </div>
    </div>
  )
}

export function Runsheet({ room, onMutated }: RunsheetProps) {
  const { t } = useTranslation(['admin', 'common'])
  const api = useApi()
  const [acting, setActing] = useState(false)
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function applyOrder(ids: number[]) {
    setActing(true)
    try {
      await api.rooms.reorder(room.id, { order: ids })
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function moveTimer(timer: Timer, toOrder: number) {
    setActing(true)
    try {
      await api.timers.move(room.id, timer.id, { to_order: toOrder })
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function handleMoveUp(index: number) {
    if (index <= 0) return
    const timer = room.timers[index]
    await moveTimer(timer, timer.order - 1)
  }

  async function handleMoveDown(index: number) {
    if (index >= room.timers.length - 1) return
    const timer = room.timers[index]
    await moveTimer(timer, timer.order + 1)
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = room.timers.map((t) => t.id)
    const oldIndex = ids.indexOf(active.id as number)
    const newIndex = ids.indexOf(over.id as number)
    if (oldIndex < 0 || newIndex < 0) return
    await applyOrder(arrayMove(ids, oldIndex, newIndex))
  }

  async function handleSkipTo(timer: Timer) {
    setActing(true)
    try {
      await api.rooms.skipTo(room.id, { order: timer.order })
      onMutated()
    } finally {
      setActing(false)
    }
  }

  async function handleDelete(timer: Timer) {
    setActing(true)
    try {
      await api.timers.delete(room.id, timer.id)
      setConfirmDelete(null)
      onMutated()
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="rounded-lg border border-cue-border bg-cue-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-cue-border px-5 py-3">
        <div>
          <h3 className="font-display text-lg leading-none tracking-wider text-cue-primary">
            {t('runsheet.heading')}
          </h3>
          <p className="mt-1 font-mono text-[10px] text-cue-muted tracking-widest uppercase">
            {t('runsheet.session', { count: room.timers.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setAddingNew(true); setEditingId(null) }}
          className="rounded border border-cue-accent px-3 py-1.5 font-display text-xs tracking-widest text-cue-accent hover:bg-cue-accent/10 transition-colors duration-[120ms]"
        >
          {t('runsheet.addSession')}
        </button>
      </div>

      <div className="space-y-2 px-5 py-4">
        {addingNew && (
          <TimerForm
            roomId={room.id}
            debateEnabled={room.debate_enabled}
            onSaved={() => { setAddingNew(false); onMutated() }}
            onCancel={() => setAddingNew(false)}
          />
        )}

        {room.timers.length === 0 && !addingNew && (
          <div className="rounded border border-dashed border-cue-border py-10 text-center">
            <p className="font-display text-base tracking-wider text-cue-muted">{t('runsheet.emptyTitle')}</p>
            <p className="mt-1 font-mono text-[11px] text-cue-muted/60">
              {t('runsheet.emptyHint')}
            </p>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={room.timers.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {room.timers.map((timer, index) => {
              if (editingId === timer.id) {
                return (
                  <TimerForm
                    key={timer.id}
                    roomId={room.id}
                    initial={timer}
                    debateEnabled={room.debate_enabled}
                    onSaved={() => { setEditingId(null); onMutated() }}
                    onCancel={() => setEditingId(null)}
                  />
                )
              }

              if (confirmDelete === timer.id) {
                return (
                  <div
                    key={timer.id}
                    className="flex items-center justify-between rounded border border-[#FF2040]/40 bg-[#FF2040]/5 px-3 py-3"
                  >
                    <span className="font-mono text-sm text-[#FF2040]">
                      {t('runsheet.deleteConfirm', { name: timer.session_title || timer.name })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(timer)}
                        disabled={acting}
                        className="rounded border border-[#FF2040] px-2 py-1 font-mono text-xs text-[#FF2040] hover:bg-[#FF2040]/10 disabled:opacity-50 transition-colors duration-[120ms]"
                      >
                        {t('runsheet.confirm')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded border border-cue-border px-2 py-1 font-mono text-xs text-cue-muted hover:border-cue-primary hover:text-cue-primary transition-colors duration-[120ms]"
                      >
                        {t('common:cancel')}
                      </button>
                    </div>
                  </div>
                )
              }

              return (
                <RunsheetRow
                  key={timer.id}
                  timer={timer}
                  index={index}
                  total={room.timers.length}
                  isCurrent={timer.id === room.current_timer}
                  acting={acting}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onSkipTo={() => handleSkipTo(timer)}
                  onEdit={() => { setEditingId(timer.id); setAddingNew(false) }}
                  onDelete={() => setConfirmDelete(timer.id)}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
