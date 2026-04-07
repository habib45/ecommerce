import { Outlet, useParams, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { LOCALE_CODES, DEFAULT_LOCALE, type LocaleCode } from '@/types/domain';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * BRD §3.2.2 — all customer-facing routes under /:locale prefix.
 * BRD §3.2.5 — Bengali font loaded conditionally; line-height 1.7 for bn-BD.
 * BRD §4.7 — lang attribute on <html> set to active locale code.
 */
export function LocaleLayout() {
  const { locale: paramLocale } = useParams<{ locale: string }>();
  const { i18n } = useTranslation();

  const locale: LocaleCode = LOCALE_CODES.includes(paramLocale as LocaleCode)
    ? (paramLocale as LocaleCode)
    : DEFAULT_LOCALE;

  const isBengali = locale === 'bn-BD';
  // BRD §4.7 — lang="bn" for Bangla, lang="sv" for Swedish
  const htmlLang = locale === 'bn-BD' ? 'bn' : locale;

  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Sync i18next when URL locale changes
  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    document.documentElement.lang = htmlLang;
  }, [locale, htmlLang, i18n]);

  // Redirect invalid locale prefixes to default
  if (!LOCALE_CODES.includes(paramLocale as LocaleCode)) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />;
  }

  return (
    <>
      <Helmet>
        <html lang={htmlLang} />
        {/* BRD §3.2.5 — Noto Sans Bengali loaded only for bn-BD */}
        {isBengali && (
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;700&display=swap"
            rel="stylesheet"
          />
        )}
      </Helmet>

      <div
        className={`min-h-screen flex flex-col ${isBengali ? 'font-bengali leading-bengali' : 'font-sans'}`}
      >
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}
