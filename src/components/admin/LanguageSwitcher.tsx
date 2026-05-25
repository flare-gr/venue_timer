import { useTranslation } from 'react-i18next'
import { SUPPORTED_LOCALES, type AppLocale } from '../../services/i18n'

const LABELS: Record<AppLocale, string> = { en: 'EN', el: 'ΕΛ' }

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('admin')
  const active = (i18n.resolvedLanguage ?? 'en') as AppLocale

  return (
    <div
      role="group"
      aria-label={t('language.switchTo')}
      className="flex items-center overflow-hidden rounded border border-cue-border"
    >
      {SUPPORTED_LOCALES.map((lng) => {
        const isActive = lng === active
        return (
          <button
            key={lng}
            type="button"
            onClick={() => void i18n.changeLanguage(lng)}
            aria-pressed={isActive}
            className={[
              'px-2 py-1 font-mono text-[10px] font-semibold tracking-widest uppercase transition-colors duration-[120ms]',
              isActive ? 'bg-cue-accent text-white' : 'text-cue-muted hover:text-cue-accent',
            ].join(' ')}
          >
            {LABELS[lng]}
          </button>
        )
      })}
    </div>
  )
}
