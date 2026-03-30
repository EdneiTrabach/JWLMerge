import { createI18n } from 'vue-i18n'
import pt from './locales/pt.json'
import en from './locales/en.json'
import es from './locales/es.json'

export const messages = {
  'pt-BR': pt,
  en,
  es,
}

export function createI18nInstance(locale = 'pt-BR') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages,
  })
}

export default createI18nInstance()
