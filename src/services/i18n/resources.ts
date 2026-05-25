import enCommon from './locales/en/common.json'
import enAdmin from './locales/en/admin.json'
import enDisplay from './locales/en/display.json'
import elCommon from './locales/el/common.json'
import elAdmin from './locales/el/admin.json'
import elDisplay from './locales/el/display.json'

export const defaultNS = 'common'

export const resources = {
  en: { common: enCommon, admin: enAdmin, display: enDisplay },
  el: { common: elCommon, admin: elAdmin, display: elDisplay },
}

// Namespace-keyed shape used to type the `t` function (keys come from English).
export type Resources = (typeof resources)['en']
