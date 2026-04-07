import { Helmet } from 'react-helmet-async';
import { useLocale } from '@/hooks/useLocale';
import { LOCALE_CODES, type LocaleCode } from '@/types/domain';

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
}

const SITE_NAME = 'Simbolos';
const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://simbolos.com';

function getCanonicalUrl(locale: LocaleCode, path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}/${locale}${cleanPath}`;
}

export function SEOHead({ title, description, path, image, type = 'website', noindex = false }: SEOHeadProps) {
  const { locale } = useLocale();

  const canonical = getCanonicalUrl(locale, path);
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const ogImage = image || `${BASE_URL}/og-default.png`;

  // BRD §4.7 — lang attribute mapping
  const hreflangMap: Record<LocaleCode, string> = {
    'en': 'en',
    'bn-BD': 'bn-BD',
    'sv': 'sv',
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Canonical */}
      <link rel="canonical" href={canonical} />

      {/* Hreflang alternates for all locales */}
      {LOCALE_CODES.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={hreflangMap[loc]}
          href={getCanonicalUrl(loc, path)}
        />
      ))}
      <link rel="alternate" hrefLang="x-default" href={getCanonicalUrl('en', path)} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale === 'bn-BD' ? 'bn_BD' : locale} />
      {LOCALE_CODES.filter((l) => l !== locale).map((loc) => (
        <meta key={loc} property="og:locale:alternate" content={loc === 'bn-BD' ? 'bn_BD' : loc} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}

export { SITE_NAME, BASE_URL, getCanonicalUrl };
