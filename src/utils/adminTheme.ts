export type AdminTheme = 'light' | 'dark'

const LIGHT_TOKENS: Record<string, string> = {
  '--color-cue-base':    '#EEF5FF',
  '--color-cue-surface': '#FFFFFF',
  '--color-cue-border':  '#B8CCE4',
  '--color-cue-accent':  '#0055CC',
  '--color-cue-primary': '#071428',
  '--color-cue-muted':   '#3A5C82',
}

export function applyAdminTheme(theme: AdminTheme): void {
  const root = document.documentElement
  if (theme === 'light') {
    Object.entries(LIGHT_TOKENS).forEach(([k, v]) => root.style.setProperty(k, v))
  } else {
    Object.keys(LIGHT_TOKENS).forEach((k) => root.style.removeProperty(k))
  }
}

export function clearAdminTheme(): void {
  Object.keys(LIGHT_TOKENS).forEach((k) =>
    document.documentElement.style.removeProperty(k),
  )
}
