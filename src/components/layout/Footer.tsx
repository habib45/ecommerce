import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/useLocale';
import { LanguageSwitcher } from './LanguageSwitcher';

// BRD §3.2.2 — language switcher also in footer
export function Footer() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const prefix = `/${locale}`;

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              {t('footer.about')}
            </h3>
            <p className="text-sm text-gray-500">
              {t('seo.homeDescription')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              {t('nav.products')}
            </h3>
            <ul className="space-y-2">
              <li><Link to={`${prefix}/products`} className="text-sm text-gray-500 hover:text-gray-700">{t('nav.products')}</Link></li>
              <li><Link to={`${prefix}/categories`} className="text-sm text-gray-500 hover:text-gray-700">{t('nav.categories')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-2">
              <li><Link to={`${prefix}/shipping`} className="text-sm text-gray-500 hover:text-gray-700">{t('footer.shipping')}</Link></li>
              <li><Link to={`${prefix}/returns`} className="text-sm text-gray-500 hover:text-gray-700">{t('footer.returns')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              {t('common.language')}
            </h3>
            <LanguageSwitcher />
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Store. {t('footer.allRightsReserved')}.
          </p>
          <div className="flex gap-4">
            <Link to={`${prefix}/terms`} className="text-xs text-gray-400 hover:text-gray-600">{t('footer.terms')}</Link>
            <Link to={`${prefix}/privacy`} className="text-xs text-gray-400 hover:text-gray-600">{t('footer.privacy')}</Link>
            <Link to={`${prefix}/cookies`} className="text-xs text-gray-400 hover:text-gray-600">{t('footer.cookiePolicy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
