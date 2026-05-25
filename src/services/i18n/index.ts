import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { resources, defaultNS } from './resources'

export const SUPPORTED_LOCALES = ['en', 'el'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export const LOCALE_STORAGE_KEY = 'venue-timer-locale'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    load: 'languageOnly',
    defaultNS,
    ns: ['common', 'admin', 'display'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

function applyDocumentLang(lng: string) {
  document.documentElement.lang = lng
}
applyDocumentLang(i18n.resolvedLanguage ?? 'en')
i18n.on('languageChanged', applyDocumentLang)

export default i18n
