import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@/i18n/locales/en.json';
import bnBD from '@/i18n/locales/bn-BD.json';
import sv from '@/i18n/locales/sv.json';

import type { LocaleCode } from '@/types/domain';

export const SUPPORTED_LOCALES: LocaleCode[] = ['en', 'bn-BD', 'sv'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'bn-BD': { translation: bnBD },
      sv: { translation: sv },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES,
    interpolation: {
      escapeValue: false, // React handles escaping
    },
    detection: {
      // BRD §3.2.2 — detection order: URL → cookie → browser
      order: ['path', 'cookie', 'navigator'],
      lookupFromPathIndex: 0,
      lookupCookie: 'NEXT_LOCALE', // BRD §3.2.2 — 1-year TTL
      caches: ['cookie'],
      cookieMinutes: 525600, // 1 year
    },
    // ICU plural rules — Bangla: 2 forms (1, other); Swedish: 2 forms (1, other)
    // BRD §3.2.3
    pluralSeparator: '_',
    keySeparator: '.',
    nsSeparator: ':',
  });

export default i18n;

/**
 * Programmatic locale change — updates i18n + cookie.
 * BRD §3.2.2 — switching preserves current page path without full reload.
 */
export function changeLocale(locale: LocaleCode): void {
  i18n.changeLanguage(locale);
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
  document.documentElement.lang = locale === 'bn-BD' ? 'bn' : locale;
}
