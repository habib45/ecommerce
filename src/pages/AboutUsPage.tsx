import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useLocale } from '@/hooks/useLocale';
import { useActiveContentBlocks } from '@/hooks/useContentBlocks';
import type { TranslationMap, LocaleCode } from '@/types/domain';

function resolveTranslation(map: TranslationMap, locale: LocaleCode): string {
  return map[locale] ?? map['en'] ?? '';
}

export function AboutUsPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data: sections = [], isLoading } = useActiveContentBlocks('about_us');

  return (
    <>
      <Helmet>
        <title>{t('aboutUs.metaTitle')}</title>
        <meta name="description" content={t('aboutUs.metaDescription')} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {t('aboutUs.title')}
        </h1>

        {isLoading ? (
          <div className="text-gray-500 text-sm">{t('common.loading')}</div>
        ) : sections.length > 0 ? (
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.id}>
                {section.image_url && (
                  <img
                    src={section.image_url}
                    alt={resolveTranslation(section.name as TranslationMap, locale as LocaleCode)}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {resolveTranslation(section.name as TranslationMap, locale as LocaleCode)}
                </h2>
                <div
                  className="prose prose-gray max-w-none text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: resolveTranslation(section.body as TranslationMap, locale as LocaleCode),
                  }}
                />
              </section>
            ))}
          </div>
        ) : (
          /* Fallback to static i18n content when no DB sections exist */
          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {t('aboutUs.whoWeAreTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('aboutUs.whoWeAreText')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {t('aboutUs.missionTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('aboutUs.missionText')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {t('aboutUs.whyChooseUsTitle')}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>{t('aboutUs.whyChooseUs1')}</li>
                <li>{t('aboutUs.whyChooseUs2')}</li>
                <li>{t('aboutUs.whyChooseUs3')}</li>
                <li>{t('aboutUs.whyChooseUs4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {t('aboutUs.valuesTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {t('aboutUs.valuesText')}
              </p>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
