import type { Timer } from '../../services/api'

interface StateBadgeProps {
  state: Timer['state']
}

const CONFIG: Record<Timer['state'], { label: string; dot: string; cls: string }> = {
  idle:     { label: 'IDLE',     dot: '#3A5C82', cls: 'bg-cue-muted/10 text-cue-muted' },
  running:  { label: 'RUNNING',  dot: '#00F078', cls: 'bg-[#00F078]/10 text-[#00F078]' },
  paused:   { label: 'PAUSED',   dot: '#FFAA00', cls: 'bg-[#FFAA00]/10 text-[#FFAA00]' },
  overtime: { label: 'OVERTIME', dot: '#FF2040', cls: 'bg-[#FF2040]/10 text-[#FF2040]' },
}

export function StateBadge({ state }: StateBadgeProps) {
  const { label, dot, cls } = CONFIG[state]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest ${cls}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: dot, boxShadow: `0 0 5px ${dot}` }}
      />
      {label}
    </span>
  )
}
