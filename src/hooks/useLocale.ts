import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import type { LocaleCode, CurrencyCode } from '@/types/domain';
import { LOCALE_CODES, DEFAULT_LOCALE, LOCALE_CURRENCY_MAP } from '@/types/domain';
import { changeLocale } from '@/i18n/config';
import { useAuthStore } from '@/stores/authStore';

export function useLocale() {
  const { locale: paramLocale } = useParams<{ locale: string }>();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, updateLanguagePref } = useAuthStore();

  const locale: LocaleCode = LOCALE_CODES.includes(paramLocale as LocaleCode)
    ? (paramLocale as LocaleCode)
    : DEFAULT_LOCALE;

  const currency: CurrencyCode = profile?.currency_pref ?? LOCALE_CURRENCY_MAP[locale];

  // BRD §3.2.2 — switching locale preserves current page path without full reload
  const switchLocale = useCallback(
    async (newLocale: LocaleCode) => {
      changeLocale(newLocale);

      // Replace locale prefix in current path
      const pathParts = location.pathname.split('/');
      // pathParts[0] is empty, pathParts[1] is the locale
      pathParts[1] = newLocale;
      navigate(pathParts.join('/'), { replace: true });

      // BRD §3.2.2 — save to profile if authenticated
      if (profile) {
        await updateLanguagePref(newLocale);
      }
    },
    [navigate, location.pathname, profile, updateLanguagePref],
  );

  return {
    locale,
    currency,
    switchLocale,
    isRTL: false, // All 3 locales are LTR per BRD §3.2.1
    isBengali: locale === 'bn-BD',
    t: i18n.t,
  };
}
