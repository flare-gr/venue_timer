interface ShortcutHintPopupProps {
  onDismiss: () => void
  onDismissPermanent: () => void
}

export function ShortcutHintPopup({ onDismiss, onDismissPermanent }: ShortcutHintPopupProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onDismiss}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,440px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-cue-border bg-cue-surface shadow-2xl animate-fade-slide-up">
        <div className="h-[3px] bg-cue-accent" />
        <div className="flex flex-col gap-5 px-8 py-7">
          <div>
            <h2 className="font-display text-[clamp(1rem,2vw,1.5rem)] tracking-widest text-cue-primary">
              KEYBOARD SHORTCUT
            </h2>
            <p className="mt-3 font-mono text-[clamp(0.7rem,1vw,0.9rem)] leading-relaxed text-cue-muted">
              Press{' '}
              <kbd className="rounded border border-cue-border bg-cue-base px-2 py-0.5 font-mono text-cue-primary">
                `
              </kbd>{' '}
              (backtick) to return to timer selection.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onDismiss}
              className="rounded border border-cue-border px-4 py-2 font-mono text-[clamp(0.65rem,0.9vw,0.8rem)] tracking-widest text-cue-muted transition-colors duration-[120ms] hover:border-cue-primary hover:text-cue-primary"
            >
              DISMISS
            </button>
            <button
              onClick={onDismissPermanent}
              className="rounded border border-cue-accent px-4 py-2 font-mono text-[clamp(0.65rem,0.9vw,0.8rem)] tracking-widest text-cue-accent transition-colors duration-[120ms] hover:bg-cue-accent/10"
            >
              DON'T SHOW AGAIN
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
