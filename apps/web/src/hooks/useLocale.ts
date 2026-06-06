import type { Locale } from '@tavuilu/shared'
import fi from '../i18n/fi.json'
import en from '../i18n/en.json'
import { useSettingsStore } from '../stores/settingsStore'

const locales: Record<string, Locale> = { fi, en }

export function useLocale(): Locale {
  const language = useSettingsStore((s) => s.language)
  return locales[language]
}
